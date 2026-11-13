package br.inatel.loans;

import br.inatel.devices.model.Device;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.repository.LoanRepository;
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

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1"
})
@Transactional
class LoanRepositoryTest {

    @Autowired
    private LoanRepository loanRepository;

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
        user = userRepository.save(new User("Ana Silva", "loan.user@inatel.br", "Senha123", Role.PARTICIPANT));
        laboratory = laboratoryRepository.save(new Laboratory("Lab Loans"));
        device = deviceRepository.save(new Device("Multimeter", null, laboratory));
    }

    private boolean overlaps(Device target, LocalDateTime from, LocalDateTime to) {
        return loanRepository.existsByDeviceIdAndStatusAndStartDateTimeLessThanAndEndDateTimeGreaterThan(
                target.getId(), LoanStatus.APPROVED, to, from);
    }

    @Test
    @DisplayName("Should persist loan linked to user, laboratory and device as requested")
    void shouldPersistLoanLinkedToUserLaboratoryAndDevice() {
        Loan saved = loanRepository.save(new Loan(user, laboratory, device, start, end));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUser().getId()).isEqualTo(user.getId());
        assertThat(saved.getLaboratory().getId()).isEqualTo(laboratory.getId());
        assertThat(saved.getDevice().getId()).isEqualTo(device.getId());
        assertThat(saved.getStatus()).isEqualTo(LoanStatus.REQUESTED);
        assertThat(saved.getStartDateTime()).isEqualTo(start);
        assertThat(saved.getEndDateTime()).isEqualTo(end);
    }

    @Test
    @DisplayName("Should find a loan by id")
    void shouldFindLoanById() {
        Loan saved = loanRepository.save(new Loan(user, laboratory, device, start, end));

        assertThat(loanRepository.findById(saved.getId())).contains(saved);
        assertThat(loanRepository.findById(-1L)).isEmpty();
    }

    @Test
    @DisplayName("Should detect an approved loan that overlaps the period")
    void shouldDetectOverlappingApprovedLoan() {
        Loan loan = new Loan(user, laboratory, device, start, end);
        loan.setStatus(LoanStatus.APPROVED);
        loanRepository.save(loan);

        assertThat(overlaps(device, start.plusHours(1), end.plusHours(1))).isTrue();
        assertThat(overlaps(device, start.minusHours(1), start.plusMinutes(30))).isTrue();
        assertThat(overlaps(device, start.plusMinutes(10), end.minusMinutes(10))).isTrue();
    }

    @Test
    @DisplayName("Should not treat periods that only touch as overlapping")
    void shouldNotOverlapWhenPeriodsOnlyTouch() {
        Loan loan = new Loan(user, laboratory, device, start, end);
        loan.setStatus(LoanStatus.APPROVED);
        loanRepository.save(loan);

        assertThat(overlaps(device, end, end.plusHours(2))).isFalse();
        assertThat(overlaps(device, start.minusHours(2), start)).isFalse();
    }

    @Test
    @DisplayName("Should ignore loans that are not approved or belong to another device")
    void shouldIgnoreNotApprovedLoansAndOtherDevices() {
        loanRepository.save(new Loan(user, laboratory, device, start, end));
        Device otherDevice = deviceRepository.save(new Device("Oscilloscope", null, laboratory));
        Loan otherDeviceLoan = new Loan(user, laboratory, otherDevice, start, end);
        otherDeviceLoan.setStatus(LoanStatus.APPROVED);
        loanRepository.save(otherDeviceLoan);

        assertThat(overlaps(device, start, end)).isFalse();
    }

    @Test
    @DisplayName("Should find only the loans of the given user")
    void shouldFindLoansByUser() {
        User otherUser = userRepository.save(new User("Bruno", "other.loan.user@inatel.br", "Senha123", Role.PARTICIPANT));
        Loan mine = loanRepository.save(new Loan(user, laboratory, device, start, end));
        loanRepository.save(new Loan(otherUser, laboratory, device, start.plusDays(1), end.plusDays(1)));

        assertThat(loanRepository.findByUserId(user.getId())).containsExactly(mine);
    }
}
