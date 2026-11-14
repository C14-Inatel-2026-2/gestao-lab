package br.inatel.devices.controller;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.exception.DeviceStatusConflictException;
import br.inatel.devices.exception.InvalidDeviceException;
import br.inatel.labs.exception.LaboratoryNotFoundException;
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
 * Error handling for the devices endpoints only.
 * Runs before the global handler so device errors get device-specific messages;
 * anything it does not handle (e.g. malformed JSON) falls through to the global handler.
 * Status codes follow backend/docs/conventions/errors.md.
 */
@RestControllerAdvice(assignableTypes = DeviceController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DeviceExceptionHandler {

    @ExceptionHandler(InvalidDeviceException.class)
    public ResponseEntity<Map<String, String>> invalidDevice(InvalidDeviceException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler({DeviceNotFoundException.class, LaboratoryNotFoundException.class})
    public ResponseEntity<Map<String, String>> notFound(RuntimeException exception) {
        return ResponseEntity.status(404).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(DeviceStatusConflictException.class)
    public ResponseEntity<Map<String, String>> statusConflict(DeviceStatusConflictException exception) {
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
     * A path or query parameter that cannot be converted, e.g. {@code ?status=FOO} or a non-numeric id.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> invalidParameter(MethodArgumentTypeMismatchException exception) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid value for parameter '" + exception.getName() + "'"));
    }
}
