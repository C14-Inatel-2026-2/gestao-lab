package br.inatel.loans;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A device with several approved loans in different periods must stay borrowed
 * until the last one is returned.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1"
})
@Transactional
class LoanReturnIntegrationTest {

    @Autowired
    private LoanService loanService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    private User user;
    private Laboratory laboratory;
    private Device device;
    private final LocalDateTime start = LocalDateTime.of(2026, 9, 15, 8, 0);
    private final LocalDateTime end = start.plusHours(2);

    @BeforeEach
    void setUp() {
        user = userRepository.save(new User("Ana Silva", "return.user@inatel.br", "Senha123", Role.PARTICIPANT));
        laboratory = laboratoryRepository.save(new Laboratory("Lab Return"));
        device = deviceRepository.save(new Device("Multimeter", null, laboratory));
    }

    @Test
    @DisplayName("Should keep the device borrowed until the last approved loan is returned")
    void shouldKeepDeviceBorrowedUntilTheLastApprovedLoanIsReturned() {
        Loan first = loanService.create(user, laboratory, device, start, end);
        Loan second = loanService.create(user, laboratory, device, start.plusDays(1), end.plusDays(1));
        loanService.approve(first.getId());
        loanService.approve(second.getId());
        assertThat(device.getStatus()).isEqualTo(DeviceStatus.BORROWED);

        loanService.registerReturn(first.getId());

        assertThat(first.getStatus()).isEqualTo(LoanStatus.RETURNED);
        assertThat(device.getStatus()).isEqualTo(DeviceStatus.BORROWED);

        loanService.registerReturn(second.getId());

        assertThat(second.getStatus()).isEqualTo(LoanStatus.RETURNED);
        assertThat(device.getStatus()).isEqualTo(DeviceStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Should free the device when its only approved loan is returned")
    void shouldFreeTheDeviceWhenItsOnlyApprovedLoanIsReturned() {
        Loan loan = loanService.create(user, laboratory, device, start, end);
        loanService.approve(loan.getId());

        loanService.registerReturn(loan.getId());

        assertThat(device.getStatus()).isEqualTo(DeviceStatus.AVAILABLE);
    }
}
