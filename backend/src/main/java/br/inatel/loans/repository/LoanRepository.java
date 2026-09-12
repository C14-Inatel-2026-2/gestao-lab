package br.inatel.loans.repository;

import br.inatel.loans.model.Loan;

public interface LoanRepository {
    Loan save(Loan loan);
}