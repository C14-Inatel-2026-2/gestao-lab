package br.inatel.loans;

import br.inatel.devices.model.Device;
import br.inatel.labs.model.Laboratory;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LoanTest {

    private final User user = new User("Lucas", "lucas@inatel.br", "Senha123", Role.PARTICIPANT);
    private final Laboratory lab = new Laboratory("Laboratorio de Software");
    private final Device device = new Device("Multimeter", null, lab);
    private final LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
    private final LocalDateTime end = LocalDateTime.of(2026, 9, 15, 10, 0);

    @Test
    void shouldStoreConstructorValues() {
        Loan loan = new Loan(user, lab, device, start, end);

        assertEquals(user, loan.getUser());
        assertEquals(lab, loan.getLaboratory());
        assertEquals(device, loan.getDevice());
        assertEquals(start, loan.getStartDateTime());
        assertEquals(end, loan.getEndDateTime());
    }

    @Test
    void shouldStartAsRequested() {
        Loan loan = new Loan(user, lab, device, start, end);

        assertEquals(LoanStatus.REQUESTED, loan.getStatus());
    }

    @Test
    void shouldChangeStatus() {
        Loan loan = new Loan(user, lab, device, start, end);

        loan.setStatus(LoanStatus.APPROVED);

        assertEquals(LoanStatus.APPROVED, loan.getStatus());
    }

    @Test
    void shouldHaveNullIdBeforePersistence() {
        Loan loan = new Loan(user, lab, device, start, end);

        assertNull(loan.getId());
    }
}
