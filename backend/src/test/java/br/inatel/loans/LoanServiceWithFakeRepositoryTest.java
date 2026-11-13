package br.inatel.loans;

import br.inatel.devices.model.Device;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class LoanServiceWithFakeRepositoryTest {

    private static class InMemoryLoanRepository implements LoanRepository {
        final List<Loan> saved = new ArrayList<>();

        @Override
        public Loan save(Loan loan) {
            saved.add(loan);
            return loan;
        }

        @Override
        public Optional<Loan> findById(Long id) {
            return Optional.empty();
        }

        @Override
        public List<Loan> findAll() {
            return saved;
        }

        @Override
        public List<Loan> findByUserId(Long userId) {
            return saved;
        }

        @Override
        public boolean existsByDeviceIdAndStatus(Long deviceId, LoanStatus status) {
            return false;
        }

        @Override
        public boolean existsByDeviceIdAndStatusAndStartDateTimeLessThanAndEndDateTimeGreaterThan(
                Long deviceId, LoanStatus status, LocalDateTime end, LocalDateTime start) {
            return false;
        }
    }

    private InMemoryLoanRepository repository;
    private LoanService service;
    private User user;
    private Laboratory laboratory;
    private Device device;

    @BeforeEach
    void setUp() {
        repository = new InMemoryLoanRepository();
        service = new LoanService(repository, mock(DeviceService.class));
        user = new User("Lucas", "lucas@inatel.br", "Senha123", Role.PARTICIPANT);
        laboratory = new Laboratory("Laboratorio de Software");
        device = new Device("Multimeter", null, laboratory);
    }

    @Test
    void shouldPersistLoanWhenDatesAreValid() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);

        service.create(user, laboratory, device, start, start.plusHours(2));

        assertEquals(1, repository.saved.size());
    }

    @Test
    void shouldAcceptMinimumValidInterval() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);

        Loan loan = service.create(user, laboratory, device, start, start.plusMinutes(1));

        assertEquals(start.plusMinutes(1), loan.getEndDateTime());
    }
}
