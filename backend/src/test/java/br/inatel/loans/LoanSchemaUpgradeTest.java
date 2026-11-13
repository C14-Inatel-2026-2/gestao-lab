package br.inatel.loans;

import br.inatel.BackendApplication;
import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.labs.model.Laboratory;
import br.inatel.loans.dto.LoanResponse;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Starts the application against a SQLite file that has the schema from main (loans without
 * device and status, already holding a loan) and checks that the upgrade keeps the history
 * and that reading and writing loans still works afterwards.
 */
class LoanSchemaUpgradeTest {

    @TempDir
    Path directory;

    private String createDatabaseWithMainSchemaAndOneLoan() throws SQLException {
        String url = "jdbc:sqlite:" + directory.resolve("main-schema.db");
        try (Connection connection = DriverManager.getConnection(url);
             Statement statement = connection.createStatement()) {
            statement.execute("create table users (id integer primary key autoincrement, "
                    + "name varchar(255) not null, email varchar(255) not null unique, "
                    + "password varchar(255) not null, role varchar(255) not null)");
            statement.execute("create table laboratories (id integer primary key autoincrement, "
                    + "name varchar(255) not null)");
            statement.execute("create table loans (id integer primary key autoincrement, "
                    + "user_id bigint not null, laboratory_id bigint not null, "
                    + "start_date_time timestamp not null, end_date_time timestamp not null, "
                    + "foreign key (user_id) references users(id), "
                    + "foreign key (laboratory_id) references laboratories(id))");
            statement.execute("insert into users (name, email, password, role) "
                    + "values ('Ana Silva', 'legacy@inatel.br', 'hashed', 'PARTICIPANT')");
            statement.execute("insert into laboratories (name) values ('Legacy Lab')");
            try (PreparedStatement insertLoan = connection.prepareStatement(
                    "insert into loans (user_id, laboratory_id, start_date_time, end_date_time) values (1, 1, ?, ?)")) {
                insertLoan.setTimestamp(1, Timestamp.valueOf(LocalDateTime.of(2026, 9, 1, 8, 0)));
                insertLoan.setTimestamp(2, Timestamp.valueOf(LocalDateTime.of(2026, 9, 1, 10, 0)));
                insertLoan.executeUpdate();
            }
        }
        return url;
    }

    @Test
    @DisplayName("Should upgrade a database from main keeping old loans as returned history")
    void shouldUpgradeDatabaseFromMainKeepingOldLoansAsReturnedHistory() throws Exception {
        String url = createDatabaseWithMainSchemaAndOneLoan();

        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(BackendApplication.class)
                .run("--server.port=0",
                        "--spring.datasource.url=" + url,
                        "--spring.jpa.hibernate.ddl-auto=update",
                        "--spring.datasource.hikari.maximum-pool-size=1")) {
            LoanRepository loans = context.getBean(LoanRepository.class);

            List<Loan> existing = loans.findAll();
            assertThat(existing).hasSize(1);
            Loan legacy = existing.get(0);
            assertThat(legacy.getStatus()).isEqualTo(LoanStatus.RETURNED);
            assertThat(legacy.getDevice()).isNull();
            assertThat(legacy.getStartDateTime()).isEqualTo(LocalDateTime.of(2026, 9, 1, 8, 0));
            assertThat(LoanResponse.from(legacy).deviceId()).isNull();

            User user = legacy.getUser();
            Laboratory laboratory = legacy.getLaboratory();
            Device device = context.getBean(DeviceRepository.class)
                    .save(new Device("Multimeter", null, laboratory));
            LoanService loanService = context.getBean(LoanService.class);

            Loan created = loanService.create(user, laboratory, device,
                    LocalDateTime.of(2026, 9, 15, 8, 0), LocalDateTime.of(2026, 9, 15, 10, 0));
            Loan approved = loanService.approve(created.getId());

            assertThat(approved.getStatus()).isEqualTo(LoanStatus.APPROVED);
            assertThat(loans.findById(created.getId())).isPresent();
            assertThat(loans.findByUserId(user.getId())).hasSize(2);
            assertThat(context.getBean(DeviceRepository.class).findById(device.getId()).orElseThrow().getStatus())
                    .isEqualTo(DeviceStatus.BORROWED);
        }
    }
}
