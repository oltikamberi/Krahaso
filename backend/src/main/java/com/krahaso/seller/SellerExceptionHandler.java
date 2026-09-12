package com.krahaso.seller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Gives the seller dashboard a predictable {"message": "..."} error body so the
 * UI can show the real reason. Scoped to this package so error responses on the
 * public catalog endpoints keep their existing shape.
 */
@RestControllerAdvice(basePackages = "com.krahaso.seller")
public class SellerExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatusException(ResponseStatusException exception) {
        String message = exception.getReason() != null ? exception.getReason() : "Kërkesa dështoi";
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Të dhëna të pavlefshme")
                .orElse("Të dhëna të pavlefshme");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
