package br.inatel;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import javax.sql.DataSource;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.auth.initial-admin.enabled=false"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class DatabaseConnectionTest {

    @TempDir
    static Path temporaryDirectory;

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        // Override the application URL before Hibernate can access the development database.
        registry.add("spring.datasource.url",
                () -> "jdbc:sqlite:" + temporaryDirectory.resolve("test.db"));
    }

    @Autowired
    private DataSource dataSource;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Test
    @DisplayName("Should establish SQLite database connection and verify metadata")
    void testDatabaseConnectionMetadata() throws SQLException {
        assertThat(dataSource).isNotNull();

        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection).isNotNull();
            DatabaseMetaData metaData = connection.getMetaData();
            assertThat(metaData.getDatabaseProductName()).containsIgnoringCase("SQLite");
            assertThat(metaData.getURL())
                    .isEqualTo("jdbc:sqlite:" + temporaryDirectory.resolve("test.db"));
        }
    }

    @Test
    @DisplayName("Should persist and retrieve entity in SQLite database")
    void testEntityPersistence() {
        Laboratory lab = new Laboratory("Lab IoT");
        Laboratory savedLab = laboratoryRepository.save(lab);

        assertThat(savedLab.getId()).isNotNull();

        Optional<Laboratory> found = laboratoryRepository.findById(savedLab.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Lab IoT");

        assertThat(temporaryDirectory.resolve("test.db")).exists();
    }
}
