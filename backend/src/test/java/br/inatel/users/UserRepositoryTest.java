package br.inatel.users;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should find user by email when user exists")
    void shouldFindUserByEmailWhenExists() {
        User user = new User("Ana Silva", "ana@inatel.br", "pass123", Role.PARTICIPANT);
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("ana@inatel.br");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Ana Silva");
        assertThat(found.get().getRole()).isEqualTo(Role.PARTICIPANT);
    }

    @Test
    @DisplayName("Should return empty optional when user does not exist by email")
    void shouldReturnEmptyWhenUserNotFoundByEmail() {
        Optional<User> found = userRepository.findByEmail("naoexiste@inatel.br");

        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("Should return true when email exists and false when it does not")
    void shouldCheckIfExistsByEmail() {
        User user = new User("Carlos Souza", "carlos@inatel.br", "pass456", Role.ADMIN);
        userRepository.save(user);

        assertThat(userRepository.existsByEmail("carlos@inatel.br")).isTrue();
        assertThat(userRepository.existsByEmail("inexistente@inatel.br")).isFalse();
    }
}
