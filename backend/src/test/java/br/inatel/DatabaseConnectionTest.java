package br.inatel;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabaseConnectionTest {

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
            assertThat(metaData.getURL()).contains("jdbc:sqlite:gestaolab.db");
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

        // Verify the database file exists on disk
        File dbFile = new File("gestaolab.db");
        assertThat(dbFile.exists()).isTrue();
    }
}
