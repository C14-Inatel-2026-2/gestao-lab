package br.inatel.users.dto;

/**
 * Request payload for user authentication.
 */
public record LoginRequest(
    String email,
    String password
) {}
