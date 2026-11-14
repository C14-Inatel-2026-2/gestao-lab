package br.inatel.users.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@RestControllerAdvice(assignableTypes = {UserController.class, AuthController.class})
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
public class UserExceptionHandler extends AuthExceptionHandler {
    @Override
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> invalidRegistration(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid registration data"));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> accessDenied() {
        return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> unexpectedError(Exception exception) {
        // Preserve HTTP protocol errors such as unsupported methods and media types.
        if (exception instanceof org.springframework.web.ErrorResponse error) {
            return ResponseEntity.status(error.getStatusCode()).headers(error.getHeaders())
                    .body(Map.of("message", "Invalid request"));
        }
        org.slf4j.LoggerFactory.getLogger(UserExceptionHandler.class)
                .error("Unexpected users API failure", exception);
        return ResponseEntity.status(500).body(Map.of("message", "Internal server error"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> invalidIdentifier() {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid user id"));
    }
}
