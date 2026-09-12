package br.inatel.loans.model;

import br.inatel.labs.model.Laboratory;
import br.inatel.users.model.User;

import java.time.LocalDateTime;

public class Loan {

    private Long id;
    private User user;
    private Laboratory laboratory;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;

    public Loan(User user, Laboratory laboratory, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        this.user = user;
        this.laboratory = laboratory;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Laboratory getLaboratory() {
        return laboratory;
    }

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }
}