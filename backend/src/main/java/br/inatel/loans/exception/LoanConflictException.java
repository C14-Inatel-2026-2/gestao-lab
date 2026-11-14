package br.inatel.loans.exception;

/**
 * Thrown when a loan operation is incompatible with the current state of the loan or of its
 * device, e.g. approving a loan that is not requested or booking a device that is already taken.
 */
public class LoanConflictException extends RuntimeException {
    public LoanConflictException(String message) {
        super(message);
    }
}
