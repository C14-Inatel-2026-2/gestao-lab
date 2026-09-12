package br.inatel.loans;

import br.inatel.labs.model.Laboratory;
import br.inatel.loans.model.Loan;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository repository;

    private LoanService service;
    private User user;
    private Laboratory laboratory;
    private LocalDateTime start;
    private LocalDateTime end;

    @BeforeEach
    void setUp() {
        service = new LoanService(repository);
        user = new User("Lucas", "lucas@inatel.br", "Senha123", Role.PARTICIPANT);
        laboratory = new Laboratory("Laboratorio de Software");
        start = LocalDateTime.of(2026, 9, 15, 8, 0);
        end = LocalDateTime.of(2026, 9, 15, 10, 0);
    }

    @Test
    void shouldCreateValidLoan() {
        when(repository.save(any(Loan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Loan loan = service.create(user, laboratory, start, end);

        assertEquals(user, loan.getUser());
        assertEquals(laboratory, loan.getLaboratory());
        assertEquals(start, loan.getStartDateTime());
        assertEquals(end, loan.getEndDateTime());
    }

    @Test
    void shouldRejectNullUser() {
        assertThrows(IllegalArgumentException.class,
                () -> service.create(null, laboratory, start, end));
        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectNullLaboratory() {
        assertThrows(IllegalArgumentException.class,
                () -> service.create(user, null, start, end));
        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectNullStartDateTime() {
        assertThrows(IllegalArgumentException.class,
                () -> service.create(user, laboratory, null, end));
        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectNullEndDateTime() {
        assertThrows(IllegalArgumentException.class,
                () -> service.create(user, laboratory, start, null));
        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectEndDateTimeBeforeStartDateTime() {
        LocalDateTime invalidEnd = start.minusHours(1);

        assertThrows(IllegalArgumentException.class,
                () -> service.create(user, laboratory, start, invalidEnd));
        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectEndDateTimeEqualToStartDateTime() {
        assertThrows(IllegalArgumentException.class,
                () -> service.create(user, laboratory, start, start));
        verifyNoInteractions(repository);
    }
}