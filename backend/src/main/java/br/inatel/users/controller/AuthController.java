package br.inatel.users.controller;

import br.inatel.users.dto.RegisterRequest;
import br.inatel.users.dto.RegisterResponse;
import br.inatel.users.model.Role;
import jakarta.validation.Valid;
import br.inatel.users.dto.LoginRequest;
import br.inatel.users.dto.LoginResponse;
import br.inatel.users.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller handling user authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        var user = userService.create(request.name(), request.email(), request.password(), Role.PARTICIPANT);
        return ResponseEntity.status(201).body(
                new RegisterResponse(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = userService.authenticate(request.email(), request.password());
        return ResponseEntity.ok(response);
    }
}
