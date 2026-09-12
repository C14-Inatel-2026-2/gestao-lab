package br.inatel.users.service;

import br.inatel.users.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmail(email).isEmpty();
    }

    /**
     * Validates whether a password meets the minimum security requirements:
     * <ul>
     *   <li>At least {@value #MIN_PASSWORD_LENGTH} characters</li>
     *   <li>At least one digit</li>
     *   <li>At least one uppercase letter</li>
     * </ul>
     *
     * @param password the password to validate (may be null)
     * @return true if the password meets all requirements, false otherwise
     */
    public boolean isPasswordValid(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            return false;
        }
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasUpperCase = password.chars().anyMatch(Character::isUpperCase);
        return hasDigit && hasUpperCase;
    }
}