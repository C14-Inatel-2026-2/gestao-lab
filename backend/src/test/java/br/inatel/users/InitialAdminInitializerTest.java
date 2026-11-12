package br.inatel.users;

import br.inatel.users.config.InitialAdminInitializer;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.UserService;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InitialAdminInitializerTest {
    private static final ValidatorFactory VALIDATORS = Validation.buildDefaultValidatorFactory();
    @Mock UserRepository repository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @AfterAll
    static void closeValidators() {
        VALIDATORS.close();
    }

    private InitialAdminInitializer initializer(String name, String email, String password) {
        return new InitialAdminInitializer(repository, new UserService(repository, encoder, null),
                VALIDATORS.getValidator(), name, email, password);
    }

    @Test
    void createsAdminWithBcryptPassword() {
        initializer("Admin", "admin@inatel.br", "Senha123").run(null);

        var saved = ArgumentCaptor.forClass(User.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getName()).isEqualTo("Admin");
        assertThat(saved.getValue().getEmail()).isEqualTo("admin@inatel.br");
        assertThat(saved.getValue().getRole()).isEqualTo(Role.ADMIN);
        assertThat(saved.getValue().getPassword()).isNotEqualTo("Senha123");
        assertThat(encoder.matches("Senha123", saved.getValue().getPassword())).isTrue();
    }

    @Test
    void skipsCreationWhenAdminExistsEvenWithoutConfiguredCredentials() {
        when(repository.existsByRole(Role.ADMIN)).thenReturn(true);
        initializer("", "", "").run(null);
        verify(repository, never()).save(any());
        verify(repository, never()).existsByEmail(any());
    }

    @Test
    void doesNotCreateAnotherAdminOnRestart() {
        when(repository.existsByRole(Role.ADMIN)).thenReturn(false, true);
        var initializer = initializer("Admin", "admin@inatel.br", "Senha123");
        initializer.run(null);
        initializer.run(null);
        verify(repository).save(any());
    }

    @Test
    void refusesEmailAlreadyUsedByParticipant() {
        when(repository.existsByEmail("existing@inatel.br")).thenReturn(true);
        assertThatThrownBy(() -> initializer("Admin", "existing@inatel.br", "Senha123").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Initial administrator email is already registered");
        verify(repository, never()).save(any());
    }

    @ParameterizedTest
    @CsvSource({"'',admin@inatel.br,Senha123", "Admin,'',Senha123", "Admin,invalid,Senha123",
            "Admin,admin@inatel.br,''", "Admin,admin@inatel.br,weak"})
    void refusesInvalidCredentials(String name, String email, String password) {
        assertThatThrownBy(() -> initializer(name, email, password).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Valid initial administrator name, email and password are required");
        verify(repository, never()).save(any());
    }
}
