package br.inatel.labs.controller;

import br.inatel.labs.exception.LaboratoryNotFoundException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(assignableTypes = LaboratoryController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LaboratoryExceptionHandler {
    @ExceptionHandler(LaboratoryNotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(LaboratoryNotFoundException exception) {
        return ResponseEntity.status(404).body(Map.of("message", exception.getMessage()));
    }
}
