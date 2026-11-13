package br.inatel.users.dto;

import br.inatel.users.model.Role;

/**
 * Response payload returned upon successful authentication.
 */
public record LoginResponse(
    String token,
    Long userId,
    String name,
    String email,
    Role role
) {}
