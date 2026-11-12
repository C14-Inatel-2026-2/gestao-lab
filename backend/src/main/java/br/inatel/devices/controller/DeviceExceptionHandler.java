package br.inatel.devices.controller;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.exception.InvalidDeviceException;
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
 * Error handling for the devices endpoints only.
 * Runs before the global handler so device errors get device-specific messages;
 * anything it does not handle (e.g. malformed JSON, laboratory not found) falls through to the global handler.
 */
@RestControllerAdvice(assignableTypes = DeviceController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DeviceExceptionHandler {

    @ExceptionHandler(InvalidDeviceException.class)
    public ResponseEntity<Map<String, String>> invalidDevice(InvalidDeviceException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(DeviceNotFoundException.class)
    public ResponseEntity<Map<String, String>> deviceNotFound(DeviceNotFoundException exception) {
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
