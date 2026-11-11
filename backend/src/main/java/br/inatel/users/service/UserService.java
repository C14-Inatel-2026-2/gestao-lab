package br.inatel.users.service;

import br.inatel.users.dto.LoginResponse;
import br.inatel.users.exception.InvalidCredentialsException;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmail(email).isEmpty();
    }

    public User create(String name, String email, String password, Role role) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("User name is required");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("User email is required");
        }
        if (!isPasswordValid(password)) {
            throw new IllegalArgumentException("User password is invalid");
        }
        if (role == null) {
            throw new IllegalArgumentException("User role is required");
        }
        if (!isEmailAvailable(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String hashedPassword = passwordEncoder.encode(password);
        return userRepository.save(new User(name, email, hashedPassword, role));
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

    /**
     * Validates user credentials against the database.
     * Prevents email enumeration leakage by throwing the exact same exception
     * when the email does not exist or the password does not match.
     *
     * @param email user email
     * @param password user password
     * @return the authenticated User domain model
     * @throws InvalidCredentialsException if credentials are invalid or missing
     */
    public User validateCredentials(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return user;
    }

    /**
     * Authenticates a user against credentials stored in the database.
     * Generates a session token upon successful validation.
     *
     * @param email user email
     * @param password user password
     * @return LoginResponse containing authentication token and user information
     */
    public LoginResponse authenticate(String email, String password) {
        User user = validateCredentials(email, password);
        String token = UUID.randomUUID().toString();
        return new LoginResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}