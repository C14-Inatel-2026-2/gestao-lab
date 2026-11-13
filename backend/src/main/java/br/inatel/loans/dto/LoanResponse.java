package br.inatel.loans.dto;

import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;

import java.time.LocalDateTime;

/**
 * Response payload representing a Loan in API responses.
 * Exposes only ids, the status and the period, never the full User (which holds the password hash).
 */
public record LoanResponse(
        Long id,
        Long userId,
        Long laboratoryId,
        Long deviceId,
        LoanStatus status,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime
) {
    /**
     * Factory method to map a Loan entity to LoanResponse.
     */
    public static LoanResponse from(Loan loan) {
        return new LoanResponse(
                loan.getId(),
                loan.getUser().getId(),
                loan.getLaboratory().getId(),
                loan.getDevice().getId(),
                loan.getStatus(),
                loan.getStartDateTime(),
                loan.getEndDateTime());
    }
}
