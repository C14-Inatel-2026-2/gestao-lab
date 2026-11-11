package br.inatel.loans;

import br.inatel.labs.model.Laboratory;
import br.inatel.loans.exception.InvalidLoanException;
import br.inatel.loans.model.Loan;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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

    private void assertInvalidLoan(String expectedMessage, Executable action) {
        InvalidLoanException exception = assertThrows(InvalidLoanException.class, action);
        assertEquals(expectedMessage, exception.getMessage());
        verifyNoInteractions(repository);
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
        assertInvalidLoan("User must not be null",
                () -> service.create(null, laboratory, start, end));
    }

    @Test
    void shouldRejectNullLaboratory() {
        assertInvalidLoan("Laboratory must not be null",
                () -> service.create(user, null, start, end));
    }

    @Test
    void shouldRejectNullStartDateTime() {
        assertInvalidLoan("Start date/time must not be null",
                () -> service.create(user, laboratory, null, end));
    }

    @Test
    void shouldRejectNullEndDateTime() {
        assertInvalidLoan("End date/time must not be null",
                () -> service.create(user, laboratory, start, null));
    }

    @Test
    void shouldRejectEndDateTimeBeforeStartDateTime() {
        assertInvalidLoan("End date/time must be after start date/time",
                () -> service.create(user, laboratory, start, start.minusHours(1)));
    }

    @Test
    void shouldRejectEndDateTimeEqualToStartDateTime() {
        assertInvalidLoan("End date/time must be after start date/time",
                () -> service.create(user, laboratory, start, start));
    }

    @Test
    void shouldSendBuiltLoanToRepository() {
        when(repository.save(any(Loan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(user, laboratory, start, end);

        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(repository, times(1)).save(captor.capture());
        assertEquals(user, captor.getValue().getUser());
        assertEquals(laboratory, captor.getValue().getLaboratory());
    }

    @Test
    void shouldPropagateRepositoryFailure() {
        when(repository.save(any(Loan.class)))
                .thenThrow(new RuntimeException("database unavailable"));

        assertThrows(RuntimeException.class,
                () -> service.create(user, laboratory, start, end));
    }
}