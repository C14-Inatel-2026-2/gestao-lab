package br.inatel.devices;

import br.inatel.devices.exception.DeviceStatusConflictException;
import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.loans.service.LoanService;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Races an administrator releasing a device against the approval of a loan of the same device.
 * Whatever the interleaving, a device must never end up AVAILABLE while it has an approved loan.
 *
 * The test is not transactional on purpose: each thread needs its own transaction. The pool name
 * gives it a dedicated Spring context, so the rows it leaves behind never reach other tests.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1",
        "spring.datasource.hikari.pool-name=device-status-concurrency",
        "spring.jpa.show-sql=false"
})
class DeviceStatusConcurrencyTest {

    private static final int ROUNDS = 200;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private LoanService loanService;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should never leave a device available while it has an approved loan")
    void shouldKeepDeviceBorrowedWhenReleaseRacesWithApproval() throws Exception {
        Laboratory laboratory = laboratoryRepository.save(new Laboratory("Lab Concurrency"));
        User user = userRepository.save(
                new User("Ana Silva", "ana.concurrency@inatel.br", "hashed", Role.PARTICIPANT));
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            for (int round = 0; round < ROUNDS; round++) {
                Device device = deviceRepository.save(new Device("Oscilloscope " + round, null, laboratory));
                LocalDateTime start = LocalDateTime.of(2026, 12, 1, 8, 0);
                Loan loan = loanRepository.save(new Loan(user, laboratory, device, start, start.plusHours(2)));
                Long deviceId = device.getId();
                Long loanId = loan.getId();
                CountDownLatch startSignal = new CountDownLatch(1);

                Future<?> approval = executor.submit(() -> {
                    startSignal.await();
                    return loanService.approve(loanId);
                });
                Future<?> release = executor.submit(() -> {
                    startSignal.await();
                    try {
                        deviceService.changeStatusManually(deviceId, DeviceStatus.AVAILABLE);
                    } catch (DeviceStatusConflictException expected) {
                        // The approval won the race: refusing the release is the correct outcome.
                    }
                    return null;
                });

                startSignal.countDown();
                approval.get(30, TimeUnit.SECONDS);
                release.get(30, TimeUnit.SECONDS);

                assertThat(loanRepository.findById(loanId).orElseThrow().getStatus())
                        .isEqualTo(LoanStatus.APPROVED);
                assertThat(deviceRepository.findById(deviceId).orElseThrow().getStatus())
                        .as("device status after round %d", round)
                        .isEqualTo(DeviceStatus.BORROWED);
            }
        } finally {
            executor.shutdownNow();
        }
    }
}
