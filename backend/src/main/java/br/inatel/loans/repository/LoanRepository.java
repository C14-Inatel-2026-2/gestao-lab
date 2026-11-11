package br.inatel.loans.repository;

import br.inatel.loans.model.Loan;
import org.springframework.data.repository.Repository;

public interface LoanRepository extends Repository<Loan, Long> {
    Loan save(Loan loan);
}