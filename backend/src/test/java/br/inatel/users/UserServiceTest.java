package br.inatel.users;

import br.inatel.users.dto.LoginResponse;
import br.inatel.users.exception.InvalidCredentialsException;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    // --- Email availability ---

    @Test
    void shouldReturnTrueWhenEmailIsAvailable() {
        when(userRepository.findByEmail("new@inatel.br"))
                .thenReturn(Optional.empty());

        assertThat(userService.isEmailAvailable("new@inatel.br")).isTrue();
    }

    @Test
    void shouldReturnFalseWhenEmailIsAlreadyTaken() {
        User existingUser = new User("Lucas", "taken@inatel.br", "hashed", Role.PARTICIPANT);
        when(userRepository.findByEmail("taken@inatel.br"))
                .thenReturn(Optional.of(existingUser));

        assertThat(userService.isEmailAvailable("taken@inatel.br")).isFalse();
    }

    // --- User creation ---

    @Test
    void shouldCreateUserWithHashedPassword() {
        when(userRepository.findByEmail("new@inatel.br"))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode("Senha123"))
                .thenReturn("$2a$10$hashedPassword");
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        User user = userService.create("Lucas", "new@inatel.br", "Senha123", Role.PARTICIPANT);

        assertThat(user.getName()).isEqualTo("Lucas");
        assertThat(user.getEmail()).isEqualTo("new@inatel.br");
        assertThat(user.getRole()).isEqualTo(Role.PARTICIPANT);
        verify(passwordEncoder).encode("Senha123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void shouldHashPasswordBeforePersisting() {
        when(userRepository.findByEmail("new@inatel.br"))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode("Senha123"))
                .thenReturn("$2a$10$hashedPassword");
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        userService.create("Lucas", "new@inatel.br", "Senha123", Role.PARTICIPANT);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getPassword()).isEqualTo("$2a$10$hashedPassword");
        assertThat(savedUser.getPassword()).isNotEqualTo("Senha123");
    }

    @Test
    void shouldRejectDuplicatedEmailWhenCreatingUser() {
        User existingUser = new User("Lucas", "taken@inatel.br", "hashed", Role.PARTICIPANT);
        when(userRepository.findByEmail("taken@inatel.br"))
                .thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> userService.create("Maria", "taken@inatel.br", "Senha123", Role.PARTICIPANT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already registered");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectNullNameWhenCreatingUser() {
        assertThatThrownBy(() -> userService.create(null, "new@inatel.br", "Senha123", Role.PARTICIPANT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User name is required");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectBlankNameWhenCreatingUser() {
        assertThatThrownBy(() -> userService.create("  ", "new@inatel.br", "Senha123", Role.PARTICIPANT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User name is required");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectNullEmailWhenCreatingUser() {
        assertThatThrownBy(() -> userService.create("Lucas", null, "Senha123", Role.PARTICIPANT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User email is required");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectNullRoleWhenCreatingUser() {
        assertThatThrownBy(() -> userService.create("Lucas", "new@inatel.br", "Senha123", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User role is required");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldRejectInvalidPasswordWhenCreatingUser() {
        assertThatThrownBy(() -> userService.create("Lucas", "new@inatel.br", "fraca", Role.PARTICIPANT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User password is invalid");

        verify(userRepository, never()).findByEmail("new@inatel.br");
        verify(userRepository, never()).save(any(User.class));
    }

    // --- Password validation rules ---

    @Test
    void shouldAcceptPasswordWithDigitUppercaseAndMinimumLength() {
        assertThat(userService.isPasswordValid("Senha123")).isTrue();
    }

    @Test
    void shouldRejectPasswordShorterThanMinimumLength() {
        assertThat(userService.isPasswordValid("Ab1")).isFalse();
    }

    @Test
    void shouldRejectPasswordWithoutDigit() {
        assertThat(userService.isPasswordValid("SenhaSemNumero")).isFalse();
    }

    @Test
    void shouldRejectPasswordWithoutUppercase() {
        assertThat(userService.isPasswordValid("senha123")).isFalse();
    }

    @Test
    void shouldRejectNullPassword() {
        assertThat(userService.isPasswordValid(null)).isFalse();
    }

    @Test
    void shouldRejectPasswordWithExactlySevenCharacters() {
        assertThat(userService.isPasswordValid("Senha12")).isFalse();
    }

    // --- Authentication ---

    @Test
    void shouldAuthenticateSuccessfullyWhenCredentialsAreValid() {
        User user = new User("Lucas", "lucas@inatel.br", "$2a$10$hashed", Role.ADMIN);
        when(userRepository.findByEmail("lucas@inatel.br")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Senha123", "$2a$10$hashed")).thenReturn(true);

        LoginResponse response = userService.authenticate("lucas@inatel.br", "Senha123");

        assertThat(response).isNotNull();
        assertThat(response.token()).isNotNull().isNotBlank();
        assertThat(response.name()).isEqualTo("Lucas");
        assertThat(response.email()).isEqualTo("lucas@inatel.br");
        assertThat(response.role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void shouldRejectAuthenticationWhenUserDoesNotExist() {
        when(userRepository.findByEmail("inexistente@inatel.br")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.authenticate("inexistente@inatel.br", "Senha123"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void shouldRejectAuthenticationWhenPasswordDoesNotMatch() {
        User user = new User("Lucas", "lucas@inatel.br", "$2a$10$hashed", Role.ADMIN);
        when(userRepository.findByEmail("lucas@inatel.br")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SenhaErrada", "$2a$10$hashed")).thenReturn(false);

        assertThatThrownBy(() -> userService.authenticate("lucas@inatel.br", "SenhaErrada"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void shouldRejectAuthenticationWhenEmailOrPasswordIsBlank() {
        assertThatThrownBy(() -> userService.authenticate("", "Senha123"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");

        assertThatThrownBy(() -> userService.authenticate("lucas@inatel.br", "  "))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    // --- Credential validation ---

    @Test
    void shouldValidateCredentialsSuccessfullyAndReturnUser() {
        User user = new User("Lucas", "lucas@inatel.br", "$2a$10$hashed", Role.ADMIN);
        when(userRepository.findByEmail("lucas@inatel.br")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Senha123", "$2a$10$hashed")).thenReturn(true);

        User authenticatedUser = userService.validateCredentials("lucas@inatel.br", "Senha123");

        assertThat(authenticatedUser).isNotNull();
        assertThat(authenticatedUser.getEmail()).isEqualTo("lucas@inatel.br");
        assertThat(authenticatedUser.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void shouldThrowInvalidCredentialsExceptionWhenEmailNotFoundInValidation() {
        when(userRepository.findByEmail("inexistente@inatel.br")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.validateCredentials("inexistente@inatel.br", "Senha123"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void shouldThrowInvalidCredentialsExceptionWhenPasswordDoesNotMatchInValidation() {
        User user = new User("Lucas", "lucas@inatel.br", "$2a$10$hashed", Role.ADMIN);
        when(userRepository.findByEmail("lucas@inatel.br")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SenhaIncorreta", "$2a$10$hashed")).thenReturn(false);

        assertThatThrownBy(() -> userService.validateCredentials("lucas@inatel.br", "SenhaIncorreta"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }
}
