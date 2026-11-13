package br.inatel.labs.exception;

public class LaboratoryNotFoundException extends IllegalArgumentException {
    public LaboratoryNotFoundException() {
        super("Laboratory not found");
    }
}
