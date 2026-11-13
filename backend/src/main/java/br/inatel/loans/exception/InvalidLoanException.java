package br.inatel.loans.exception;

/**
 * Thrown when the data provided to create a loan is invalid.
 */
public class InvalidLoanException extends RuntimeException {

    public InvalidLoanException(String message) {
        super(message);
    }
}