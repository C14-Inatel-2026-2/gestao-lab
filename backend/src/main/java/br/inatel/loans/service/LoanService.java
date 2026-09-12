package br.inatel.loans.service;

import br.inatel.labs.model.Laboratory;
import br.inatel.loans.model.Loan;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.users.model.User;

import java.time.LocalDateTime;

public class LoanService {

    private final LoanRepository repository;

    public LoanService(LoanRepository repository) {
        this.repository = repository;
    }

    public Loan create(User user, Laboratory laboratory, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        if (user == null) {
            throw new IllegalArgumentException("User must not be null");
        }
        if (laboratory == null) {
            throw new IllegalArgumentException("Laboratory must not be null");
        }
        if (startDateTime == null) {
            throw new IllegalArgumentException("Start date/time must not be null");
        }
        if (endDateTime == null) {
            throw new IllegalArgumentException("End date/time must not be null");
        }
        if (!endDateTime.isAfter(startDateTime)) {
            throw new IllegalArgumentException("End date/time must be after start date/time");
        }

        Loan loan = new Loan(user, laboratory, startDateTime, endDateTime);
        return repository.save(loan);
    }
}