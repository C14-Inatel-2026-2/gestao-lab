package br.inatel.loans.repository;

import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import org.springframework.data.repository.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoanRepository extends Repository<Loan, Long> {
    Loan save(Loan loan);

    Optional<Loan> findById(Long id);

    List<Loan> findAll();

    List<Loan> findByUserId(Long userId);

    /**
     * True when a loan of the device with the given status overlaps the period
     * [start, end): it starts before {@code end} and ends after {@code start}.
     * Periods that only touch (one ends exactly when the other starts) do not overlap.
     */
    boolean existsByDeviceIdAndStatusAndStartDateTimeLessThanAndEndDateTimeGreaterThan(
            Long deviceId, LoanStatus status, LocalDateTime end, LocalDateTime start);
}
