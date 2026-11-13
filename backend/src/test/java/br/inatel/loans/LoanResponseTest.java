package br.inatel.loans;

import br.inatel.devices.model.Device;
import br.inatel.labs.model.Laboratory;
import br.inatel.loans.dto.LoanResponse;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class LoanResponseTest {

    @Test
    @DisplayName("Should map loan to response exposing only ids, status and period")
    void shouldMapLoanToResponse() {
        User user = new User("Ana Silva", "ana@inatel.br", "Senha123", Role.PARTICIPANT);
        Laboratory laboratory = new Laboratory("Lab IoT");
        Device device = new Device("Multimeter", null, laboratory);
        LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
        LocalDateTime end = start.plusHours(2);
        Loan loan = new Loan(user, laboratory, device, start, end);
        loan.setStatus(LoanStatus.APPROVED);
        ReflectionTestUtils.setField(user, "id", 1L);
        ReflectionTestUtils.setField(laboratory, "id", 2L);
        ReflectionTestUtils.setField(device, "id", 4L);
        ReflectionTestUtils.setField(loan, "id", 3L);

        LoanResponse response = LoanResponse.from(loan);

        assertThat(response.id()).isEqualTo(3L);
        assertThat(response.userId()).isEqualTo(1L);
        assertThat(response.laboratoryId()).isEqualTo(2L);
        assertThat(response.deviceId()).isEqualTo(4L);
        assertThat(response.status()).isEqualTo(LoanStatus.APPROVED);
        assertThat(response.startDateTime()).isEqualTo(start);
        assertThat(response.endDateTime()).isEqualTo(end);
    }

    @Test
    @DisplayName("Should map a legacy loan without device")
    void shouldMapLegacyLoanWithoutDevice() {
        User user = new User("Ana Silva", "ana@inatel.br", "Senha123", Role.PARTICIPANT);
        Laboratory laboratory = new Laboratory("Lab IoT");
        LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
        Loan loan = new Loan(user, laboratory, null, start, start.plusHours(2));
        loan.setStatus(LoanStatus.RETURNED);
        ReflectionTestUtils.setField(user, "id", 1L);
        ReflectionTestUtils.setField(laboratory, "id", 2L);
        ReflectionTestUtils.setField(loan, "id", 3L);

        LoanResponse response = LoanResponse.from(loan);

        assertThat(response.deviceId()).isNull();
        assertThat(response.status()).isEqualTo(LoanStatus.RETURNED);
    }
}
