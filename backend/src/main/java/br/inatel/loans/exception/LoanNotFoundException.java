package br.inatel.loans.exception;

/**
 * Thrown when a loan id does not match any stored loan.
 */
public class LoanNotFoundException extends RuntimeException {

    public LoanNotFoundException(String message) {
        super(message);
    }
}
