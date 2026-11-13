package br.inatel.labs.exception;

public class LaboratoryInUseException extends IllegalStateException {
    public LaboratoryInUseException() {
        super("Laboratory has linked devices or loans");
    }
}
