package br.inatel.gestaolab.domain.user;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    @Test
    @DisplayName("Should create user with valid attributes and role")
    void shouldCreateUserWithValidAttributesAndRole() {
        User user = new User("Lucas Ynoguti", "lucas@inatel.br", "secret123", Role.ADMIN);

        assertThat(user.getName()).isEqualTo("Lucas Ynoguti");
        assertThat(user.getEmail()).isEqualTo("lucas@inatel.br");
        assertThat(user.getPassword()).isEqualTo("secret123");
        assertThat(user.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    @DisplayName("Should support PARTICIPANT role for standard users")
    void shouldSupportParticipantRole() {
        User user = new User("Participante", "participante@inatel.br", "pass123", Role.PARTICIPANT);

        assertThat(user.getRole()).isEqualTo(Role.PARTICIPANT);
    }
}
