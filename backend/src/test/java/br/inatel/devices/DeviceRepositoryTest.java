package br.inatel.devices;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.loans.model.Loan;
import br.inatel.loans.model.LoanStatus;
import br.inatel.loans.repository.LoanRepository;
import br.inatel.users.model.Role;
import br.inatel.users.model.User;
import br.inatel.users.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.hikari.maximum-pool-size=1"
})
@Transactional
class DeviceRepositoryTest {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should persist device linked to laboratory")
    void shouldPersistDeviceLinkedToLaboratory() {
        Laboratory laboratory = laboratoryRepository.save(new Laboratory("Lab Devices"));

        Device saved = deviceRepository.save(new Device("Multimeter", "Digital multimeter", laboratory));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Multimeter");
        assertThat(saved.getDescription()).isEqualTo("Digital multimeter");
        assertThat(saved.getStatus()).isEqualTo(DeviceStatus.AVAILABLE);
        assertThat(saved.getLaboratory().getId()).isEqualTo(laboratory.getId());
    }

    @Test
    @DisplayName("Should find device by id")
    void shouldFindDeviceById() {
        Laboratory laboratory = laboratoryRepository.save(new Laboratory("Lab Find By Id"));
        Device saved = deviceRepository.save(new Device("Oscilloscope", null, laboratory));

        assertThat(deviceRepository.findById(saved.getId())).contains(saved);
        assertThat(deviceRepository.findById(-1L)).isEmpty();
    }

    @Test
    @DisplayName("Should find only the devices of the given laboratory")
    void shouldFindDevicesByLaboratory() {
        Laboratory labA = laboratoryRepository.save(new Laboratory("Lab A"));
        Laboratory labB = laboratoryRepository.save(new Laboratory("Lab B"));
        Device first = deviceRepository.save(new Device("Multimeter", null, labA));
        Device second = deviceRepository.save(new Device("Oscilloscope", null, labA));
        deviceRepository.save(new Device("Defibrillator", null, labB));

        List<Device> devices = deviceRepository.findByLaboratoryId(labA.getId());

        assertThat(devices).containsExactlyInAnyOrder(first, second);
    }

    @Test
    @DisplayName("Should find devices by status")
    void shouldFindDevicesByStatus() {
        Laboratory laboratory = laboratoryRepository.save(new Laboratory("Lab Status"));
        deviceRepository.save(new Device("Multimeter", null, laboratory));
        Device borrowed = deviceRepository.save(new Device("Oscilloscope", null, laboratory));
        borrowed.setStatus(DeviceStatus.BORROWED);

        List<Device> devices = deviceRepository.findByStatus(DeviceStatus.BORROWED);

        assertThat(devices).containsExactly(borrowed);
    }

    @Test
    @DisplayName("Should find devices by laboratory and status together")
    void shouldFindDevicesByLaboratoryAndStatus() {
        Laboratory labA = laboratoryRepository.save(new Laboratory("Lab A Combined"));
        Laboratory labB = laboratoryRepository.save(new Laboratory("Lab B Combined"));
        deviceRepository.save(new Device("Multimeter", null, labA));
        Device borrowedInA = deviceRepository.save(new Device("Oscilloscope", null, labA));
        borrowedInA.setStatus(DeviceStatus.BORROWED);
        Device borrowedInB = deviceRepository.save(new Device("Defibrillator", null, labB));
        borrowedInB.setStatus(DeviceStatus.BORROWED);

        List<Device> devices = deviceRepository.findByLaboratoryIdAndStatus(labA.getId(), DeviceStatus.BORROWED);

        assertThat(devices).containsExactly(borrowedInA);
    }

    @Test
    @DisplayName("Should report approved loans only while one is still approved")
    void shouldReportApprovedLoans() {
        Laboratory laboratory = laboratoryRepository.save(new Laboratory("Lab Approved Loans"));
        Device device = deviceRepository.save(new Device("Oscilloscope", null, laboratory));
        User user = userRepository.save(
                new User("Ana Silva", "ana.loans@inatel.br", "hashed", Role.PARTICIPANT));
        LocalDateTime start = LocalDateTime.of(2026, 12, 1, 8, 0);
        Loan loan = loanRepository.save(new Loan(user, laboratory, device, start, start.plusHours(2)));

        // A loan that was only requested does not commit the device yet.
        assertThat(deviceRepository.hasApprovedLoans(device.getId())).isFalse();

        loan.setStatus(LoanStatus.APPROVED);
        loanRepository.save(loan);
        assertThat(deviceRepository.hasApprovedLoans(device.getId())).isTrue();

        loan.setStatus(LoanStatus.RETURNED);
        loanRepository.save(loan);
        assertThat(deviceRepository.hasApprovedLoans(device.getId())).isFalse();
    }
}
