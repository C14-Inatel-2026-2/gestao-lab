package br.inatel.labs.exception;

public class InvalidLaboratoryException extends RuntimeException {
    public InvalidLaboratoryException() {
        super("Laboratory name is required");
    }
}
