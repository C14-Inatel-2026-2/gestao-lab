package br.inatel.users.dto;

import br.inatel.users.model.Role;
import br.inatel.users.model.User;

/**
 * Response payload representing a User in API responses, excluding sensitive data (password).
 */
public record UserResponse(
    Long id,
    String name,
    String email,
    Role role
) {
    /**
     * Factory method to map a User entity to UserResponse.
     */
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole()
        );
    }
}
