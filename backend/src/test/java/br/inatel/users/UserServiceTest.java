package br.inatel.users;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import br.inatel.users.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private UserService userService;

    @Test
    void shouldReturnTrueWhenEmailIsAvailable() {
        when(userRepository.findByEmail("new@inatel.br"))
                .thenReturn(Optional.empty());

        assertThat(userService.isEmailAvailable("new@inatel.br")).isTrue();
    }

    @Test
    void shouldReturnFalseWhenEmailIsAlreadyTaken() {
        User existingUser = new User("Lucas", "taken@inatel.br", "123456", Role.PARTICIPANT);
        when(userRepository.findByEmail("taken@inatel.br"))
                .thenReturn(Optional.of(existingUser));

        assertThat(userService.isEmailAvailable("taken@inatel.br")).isFalse();
    }

    @Test
    void shouldCreateUserWhenEmailIsAvailable() {
        when(userRepository.findByEmail("new@inatel.br"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        User user = userService.create("Lucas", "new@inatel.br", "Senha123", Role.PARTICIPANT);

        assertThat(user.getName()).isEqualTo("Lucas");
        assertThat(user.getEmail()).isEqualTo("new@inatel.br");
        assertThat(user.getRole()).isEqualTo(Role.PARTICIPANT);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void shouldRejectDuplicatedEmailWhenCreatingUser() {
        User existingUser = new User("Lucas", "taken@inatel.br", "Senha123", Role.PARTICIPANT);
        when(userRepository.findByEmail("taken@inatel.br"))
                .thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> userService.create("Maria", "taken@inatel.br", "Senha123", Role.PARTICIPANT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already registered");

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
}
