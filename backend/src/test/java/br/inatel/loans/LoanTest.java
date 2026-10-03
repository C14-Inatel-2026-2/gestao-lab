package br.inatel.loans;

import br.inatel.labs.model.Laboratory;
import br.inatel.loans.model.Loan;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LoanTest {

    @Test
    void shouldStoreConstructorValues() {
        User user = new User("Lucas", "lucas@inatel.br", "Senha123", Role.PARTICIPANT);
        Laboratory lab = new Laboratory("Laboratorio de Software");
        LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 15, 10, 0);

        Loan loan = new Loan(user, lab, start, end);

        assertEquals(user, loan.getUser());
        assertEquals(lab, loan.getLaboratory());
        assertEquals(start, loan.getStartDateTime());
        assertEquals(end, loan.getEndDateTime());
    }

    @Test
    void shouldHaveNullIdBeforePersistence() {
        Loan loan = new Loan(
                new User("Lucas", "lucas@inatel.br", "Senha123", Role.PARTICIPANT),
                new Laboratory("Laboratorio de Software"),
                LocalDateTime.of(2026, 9, 15, 8, 0),
                LocalDateTime.of(2026, 9, 15, 10, 0));

        assertNull(loan.getId());
    }
}