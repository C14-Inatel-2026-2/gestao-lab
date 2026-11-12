package br.inatel.loans.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * Payload used to request a laboratory loan.
 * The requester is not part of the payload: it is the authenticated user.
 */
public record LoanRequest(
        @NotNull(message = "Laboratory id must not be null") Long laboratoryId,
        @NotNull(message = "Start date/time must not be null") LocalDateTime startDateTime,
        @NotNull(message = "End date/time must not be null") LocalDateTime endDateTime
) {}
