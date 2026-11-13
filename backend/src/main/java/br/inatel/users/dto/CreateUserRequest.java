package br.inatel.users.dto;

import br.inatel.users.model.Role;

/**
 * Request payload for creating a new User.
 */
public record CreateUserRequest(
    String name,
    String email,
    String password,
    Role role
) {}
