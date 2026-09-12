package br.inatel.users.repository;

import br.inatel.users.model.User;

import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
}