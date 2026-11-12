package br.inatel.users;

import br.inatel.users.config.InitialAdminInitializer;
import br.inatel.users.model.Role;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1",
        "app.auth.initial-admin.enabled=true",
        "app.auth.initial-admin.name=Initial Admin",
        "app.auth.initial-admin.email=initial-admin@inatel.br",
        "app.auth.initial-admin.password=Senha123"
})
class InitialAdminDatabaseTest {
    @Autowired UserRepository repository;
    @Autowired UserService users;
    @Autowired InitialAdminInitializer initializer;

    @Test
    void startupCreatesPersistedAdminWhoCanLoginWithoutDuplicatingOnRestart() {
        var admin = repository.findByEmail("initial-admin@inatel.br").orElseThrow();
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.getPassword()).startsWith("$2a$").isNotEqualTo("Senha123");
        assertThat(users.authenticate(admin.getEmail(), "Senha123").token()).isNotBlank();

        initializer.run(null);
        assertThat(repository.count()).isEqualTo(1);
    }
}
