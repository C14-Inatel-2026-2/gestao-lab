package br.inatel.loans;

import br.inatel.labs.model.Laboratory;
import br.inatel.loans.dto.LoanResponse;
import br.inatel.loans.model.Loan;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class LoanResponseTest {

    @Test
    @DisplayName("Should map loan to response exposing only ids and period")
    void shouldMapLoanToResponse() {
        User user = new User("Ana Silva", "ana@inatel.br", "Senha123", Role.PARTICIPANT);
        Laboratory laboratory = new Laboratory("Lab IoT");
        LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
        LocalDateTime end = start.plusHours(2);
        Loan loan = new Loan(user, laboratory, start, end);
        ReflectionTestUtils.setField(user, "id", 1L);
        ReflectionTestUtils.setField(laboratory, "id", 2L);
        ReflectionTestUtils.setField(loan, "id", 3L);

        LoanResponse response = LoanResponse.from(loan);

        assertThat(response.id()).isEqualTo(3L);
        assertThat(response.userId()).isEqualTo(1L);
        assertThat(response.laboratoryId()).isEqualTo(2L);
        assertThat(response.startDateTime()).isEqualTo(start);
        assertThat(response.endDateTime()).isEqualTo(end);
    }
}
