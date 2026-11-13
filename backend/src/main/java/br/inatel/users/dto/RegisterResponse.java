package br.inatel.users.dto;

import br.inatel.users.model.Role;

public record RegisterResponse(Long userId, String name, String email, Role role) {}
