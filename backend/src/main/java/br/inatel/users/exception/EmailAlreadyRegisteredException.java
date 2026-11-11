package br.inatel.users.exception;

public class EmailAlreadyRegisteredException extends IllegalArgumentException {
    public EmailAlreadyRegisteredException() {
        super("Email already registered");
    }
}
