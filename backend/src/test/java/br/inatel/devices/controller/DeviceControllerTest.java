package br.inatel.devices.controller;

import br.inatel.devices.dto.DeviceRequest;
import br.inatel.devices.dto.DeviceResponse;
import br.inatel.devices.dto.DeviceStatusRequest;
import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.exception.LaboratoryNotFoundException;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeviceControllerTest {

    @Mock
    private DeviceService deviceService;

    @Mock
    private LaboratoryService laboratoryService;

    @InjectMocks
    private DeviceController deviceController;

    private Laboratory laboratory;

    @BeforeEach
    void setUp() {
        laboratory = new Laboratory("Lab IoT");
        ReflectionTestUtils.setField(laboratory, "id", 2L);
    }

    private Device device(long id, String name) {
        Device device = new Device(name, "Description of " + name, laboratory);
        ReflectionTestUtils.setField(device, "id", id);
        return device;
    }

    @Test
    @DisplayName("Should return 201 Created and DeviceResponse with the laboratory name")
    void shouldReturnCreatedWhenDeviceIsValid() {
        when(laboratoryService.findById(2L)).thenReturn(laboratory);
        when(deviceService.create("Oscilloscope", "Digital oscilloscope", laboratory))
                .thenReturn(device(7L, "Oscilloscope"));

        ResponseEntity<DeviceResponse> response = deviceController.create(
                new DeviceRequest("Oscilloscope", "Digital oscilloscope", 2L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(7L);
        assertThat(response.getBody().name()).isEqualTo("Oscilloscope");
        assertThat(response.getBody().status()).isEqualTo(DeviceStatus.AVAILABLE);
        assertThat(response.getBody().laboratoryId()).isEqualTo(2L);
        assertThat(response.getBody().laboratoryName()).isEqualTo("Lab IoT");
    }

    @Test
    @DisplayName("Should propagate error and skip the service when the laboratory does not exist")
    void shouldPropagateLaboratoryNotFound() {
        when(laboratoryService.findById(99L))
                .thenThrow(new LaboratoryNotFoundException());

        assertThatThrownBy(() -> deviceController.create(new DeviceRequest("Oscilloscope", null, 99L)))
                .isInstanceOf(LaboratoryNotFoundException.class)
                .hasMessage("Laboratory not found");

        verifyNoInteractions(deviceService);
    }

    @Test
    @DisplayName("Should list devices passing the optional filters to the service")
    void shouldListDevicesWithFilters() {
        when(deviceService.list(2L, DeviceStatus.AVAILABLE))
                .thenReturn(List.of(device(7L, "Oscilloscope"), device(8L, "Multimeter")));

        List<DeviceResponse> response = deviceController.list(2L, DeviceStatus.AVAILABLE);

        assertThat(response).extracting(DeviceResponse::name)
                .containsExactly("Oscilloscope", "Multimeter");
        assertThat(response).extracting(DeviceResponse::laboratoryName)
                .containsOnly("Lab IoT");
    }

    @Test
    @DisplayName("Should return the device with its new status")
    void shouldUpdateStatus() {
        Device updated = device(7L, "Oscilloscope");
        updated.setStatus(DeviceStatus.MAINTENANCE);
        when(deviceService.changeStatusManually(7L, DeviceStatus.MAINTENANCE)).thenReturn(updated);

        DeviceResponse response = deviceController.updateStatus(7L,
                new DeviceStatusRequest(DeviceStatus.MAINTENANCE));

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.status()).isEqualTo(DeviceStatus.MAINTENANCE);
    }

    @Test
    @DisplayName("Should propagate DeviceNotFoundException when updating an unknown device")
    void shouldPropagateDeviceNotFound() {
        when(deviceService.changeStatusManually(99L, DeviceStatus.MAINTENANCE))
                .thenThrow(new DeviceNotFoundException("Device not found"));

        assertThatThrownBy(() -> deviceController.updateStatus(99L,
                new DeviceStatusRequest(DeviceStatus.MAINTENANCE)))
                .isInstanceOf(DeviceNotFoundException.class)
                .hasMessage("Device not found");
    }
}
