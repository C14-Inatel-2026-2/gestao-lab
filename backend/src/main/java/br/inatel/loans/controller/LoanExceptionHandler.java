package br.inatel.loans.controller;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.labs.exception.LaboratoryNotFoundException;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.exception.LoanConflictException;
import br.inatel.loans.exception.LoanNotFoundException;
import br.inatel.users.exception.UserNotFoundException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Error handling for the loans endpoints only.
 * Runs before the global handler so loan errors get loan-specific messages;
 * anything it does not handle (e.g. malformed JSON) falls through to the global handler.
 * Status codes follow backend/docs/conventions/errors.md: 400 for invalid data, 404 for a
 * missing resource and 409 for an operation that conflicts with the current state.
 */
@RestControllerAdvice(assignableTypes = LoanController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LoanExceptionHandler {

    @ExceptionHandler(InvalidLoanException.class)
    public ResponseEntity<Map<String, String>> invalidLoan(InvalidLoanException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler({LoanNotFoundException.class, DeviceNotFoundException.class,
            LaboratoryNotFoundException.class, UserNotFoundException.class})
    public ResponseEntity<Map<String, String>> notFound(RuntimeException exception) {
        return ResponseEntity.status(404).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(LoanConflictException.class)
    public ResponseEntity<Map<String, String>> conflict(LoanConflictException exception) {
        return ResponseEntity.status(409).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalidFields(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .sorted()
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    /**
     * A path parameter that cannot be converted, e.g. a non-numeric loan id.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> invalidParameter(MethodArgumentTypeMismatchException exception) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid value for parameter '" + exception.getName() + "'"));
    }
}
