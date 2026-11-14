package br.inatel.loans.repository;

import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoanRepository extends Repository<Loan, Long> {
    Loan save(Loan loan);

    Optional<Loan> findById(Long id);

    List<Loan> findAll();

    List<Loan> findByUserId(Long userId);

    boolean existsByDeviceIdAndStatus(Long deviceId, LoanStatus status);

    /**
     * True when a loan of the device with the given status overlaps the period
     * [start, end): it starts before {@code end} and ends after {@code start}.
     * Periods that only touch (one ends exactly when the other starts) do not overlap.
     */
    @Query("select count(l) > 0 from Loan l "
            + "where l.device.id = :deviceId and l.status = :status "
            + "and l.startDateTime < :end and l.endDateTime > :start")
    boolean existsOverlapping(@Param("deviceId") Long deviceId,
                              @Param("status") LoanStatus status,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);
}
