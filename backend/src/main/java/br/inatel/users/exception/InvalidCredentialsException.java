package br.inatel.users.exception;

/**
 * Exception thrown when user authentication fails due to invalid credentials.
 * Used for both non-existent users and password mismatches to prevent email enumeration attacks.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }

    public InvalidCredentialsException() {
        super("Invalid email or password");
    }
}
