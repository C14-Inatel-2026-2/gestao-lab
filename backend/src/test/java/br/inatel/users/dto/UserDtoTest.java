package br.inatel.users.dto;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserDtoTest {

    @Test
    @DisplayName("Should create CreateUserRequest with all fields")
    void shouldCreateCreateUserRequest() {
        CreateUserRequest request = new CreateUserRequest("Lucas", "lucas@inatel.br", "secret", Role.ADMIN);

        assertThat(request.name()).isEqualTo("Lucas");
        assertThat(request.email()).isEqualTo("lucas@inatel.br");
        assertThat(request.password()).isEqualTo("secret");
        assertThat(request.role()).isEqualTo(Role.ADMIN);
    }

    @Test
    @DisplayName("Should map User entity to UserResponse excluding password")
    void shouldMapUserToUserResponse() {
        User user = new User("Lucas", "lucas@inatel.br", "secret123", Role.PARTICIPANT);
        UserResponse response = UserResponse.from(user);

        assertThat(response.name()).isEqualTo("Lucas");
        assertThat(response.email()).isEqualTo("lucas@inatel.br");
        assertThat(response.role()).isEqualTo(Role.PARTICIPANT);
    }
}
