package br.inatel.devices;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class DeviceRepositoryTest {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

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
}
