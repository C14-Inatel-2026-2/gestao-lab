package br.inatel.loans.model;

/**
 * Lifecycle of a loan: it is requested, then approved or rejected by an admin,
 * and an approved loan is finally returned.
 */
public enum LoanStatus {
    REQUESTED,
    APPROVED,
    REJECTED,
    RETURNED
}
