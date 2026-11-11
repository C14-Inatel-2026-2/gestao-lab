package br.inatel.users;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;
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

    @Test
    @DisplayName("Should be equal when having same id and email")
    void shouldBeEqualWhenSameIdAndEmail() {
        User user1 = new User("Lucas", "lucas@inatel.br", "pass", Role.ADMIN);
        User user2 = new User("Lucas Alterado", "lucas@inatel.br", "outrapass", Role.ADMIN);

        assertThat(user1).isEqualTo(user2);
        assertThat(user1.hashCode()).isEqualTo(user2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal when having different emails")
    void shouldNotBeEqualWhenDifferentEmails() {
        User user1 = new User("Lucas", "lucas1@inatel.br", "pass", Role.ADMIN);
        User user2 = new User("Lucas", "lucas2@inatel.br", "pass", Role.ADMIN);

        assertThat(user1).isNotEqualTo(user2);
    }
}
