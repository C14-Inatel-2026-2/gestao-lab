package br.inatel.labs.controller;

import br.inatel.labs.exception.InvalidLaboratoryException;
import br.inatel.labs.exception.LaboratoryInUseException;
import br.inatel.labs.exception.LaboratoryNotFoundException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@RestControllerAdvice(assignableTypes = LaboratoryController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LaboratoryExceptionHandler {
    @ExceptionHandler(InvalidLaboratoryException.class)
    public ResponseEntity<Map<String, String>> invalidLaboratory(InvalidLaboratoryException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(LaboratoryNotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(LaboratoryNotFoundException exception) {
        return ResponseEntity.status(404).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(LaboratoryInUseException.class)
    public ResponseEntity<Map<String, String>> inUse(LaboratoryInUseException exception) {
        return ResponseEntity.status(409).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> invalidParameter(MethodArgumentTypeMismatchException exception) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid value for parameter '" + exception.getName() + "'"));
    }
}
