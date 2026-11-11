package br.inatel.users.controller;

import br.inatel.users.dto.LoginRequest;
import br.inatel.users.dto.LoginResponse;
import br.inatel.users.exception.InvalidCredentialsException;
import br.inatel.users.model.Role;
import br.inatel.users.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    @Test
    @DisplayName("Should return 200 OK and LoginResponse when credentials are valid")
    void shouldReturnOkWhenCredentialsAreValid() {
        LoginRequest request = new LoginRequest("lucas@inatel.br", "Senha123");
        LoginResponse expectedResponse = new LoginResponse("token-123", 1L, "Lucas", "lucas@inatel.br", Role.ADMIN);

        when(userService.authenticate("lucas@inatel.br", "Senha123")).thenReturn(expectedResponse);

        ResponseEntity<LoginResponse> response = authController.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isEqualTo("token-123");
        assertThat(response.getBody().email()).isEqualTo("lucas@inatel.br");
    }

    @Test
    @DisplayName("Should propagate exception when credentials are invalid")
    void shouldPropagateExceptionWhenCredentialsAreInvalid() {
        LoginRequest request = new LoginRequest("lucas@inatel.br", "wrong");

        when(userService.authenticate("lucas@inatel.br", "wrong"))
                .thenThrow(new InvalidCredentialsException("Invalid email or password"));

        assertThatThrownBy(() -> authController.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }
}
