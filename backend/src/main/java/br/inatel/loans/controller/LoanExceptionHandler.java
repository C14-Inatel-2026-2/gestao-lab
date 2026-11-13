package br.inatel.loans.controller;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.exception.LoanNotFoundException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Error handling for the loans endpoints only.
 * Runs before the global handler so loan errors get loan-specific messages;
 * anything it does not handle (e.g. malformed JSON) falls through to the global handler.
 */
@RestControllerAdvice(assignableTypes = LoanController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LoanExceptionHandler {

    @ExceptionHandler(InvalidLoanException.class)
    public ResponseEntity<Map<String, String>> invalidLoan(InvalidLoanException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler({LoanNotFoundException.class, DeviceNotFoundException.class})
    public ResponseEntity<Map<String, String>> notFound(RuntimeException exception) {
        return ResponseEntity.status(404).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalidFields(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .sorted()
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
