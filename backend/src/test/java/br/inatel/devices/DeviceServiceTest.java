package br.inatel.devices;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.exception.InvalidDeviceException;
import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeviceServiceTest {

    @Mock
    private DeviceRepository repository;

    private DeviceService service;
    private Laboratory laboratory;

    @BeforeEach
    void setUp() {
        service = new DeviceService(repository);
        laboratory = new Laboratory("Electrical Lab");
    }

    private void assertInvalidDevice(String expectedMessage, Executable action) {
        InvalidDeviceException exception = assertThrows(InvalidDeviceException.class, action);
        assertEquals(expectedMessage, exception.getMessage());
        verifyNoInteractions(repository);
    }

    @Test
    void shouldCreateAvailableDeviceLinkedToLaboratory() {
        when(repository.save(any(Device.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Device device = service.create("Oscilloscope", "Digital oscilloscope", laboratory);

        assertEquals("Oscilloscope", device.getName());
        assertEquals("Digital oscilloscope", device.getDescription());
        assertSame(laboratory, device.getLaboratory());
        assertEquals(DeviceStatus.AVAILABLE, device.getStatus());
        verify(repository, times(1)).save(any(Device.class));
    }

    @Test
    void shouldCreateDeviceWithoutDescription() {
        when(repository.save(any(Device.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Device device = service.create("Oscilloscope", null, laboratory);

        assertNull(device.getDescription());
        verify(repository, times(1)).save(any(Device.class));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "   "})
    void shouldRejectBlankName(String name) {
        assertInvalidDevice("Device name must not be blank",
                () -> service.create(name, "Digital oscilloscope", laboratory));
    }

    @Test
    void shouldRejectNullLaboratory() {
        assertInvalidDevice("Laboratory must not be null",
                () -> service.create("Oscilloscope", "Digital oscilloscope", null));
    }

    @Test
    void shouldListAllDevicesWhenNoFilterIsGiven() {
        List<Device> devices = List.of(new Device("Oscilloscope", null, laboratory));
        when(repository.findAll()).thenReturn(devices);

        assertSame(devices, service.list(null, null));
        verifyNoMoreInteractions(repository);
    }

    @Test
    void shouldListDevicesOfOneLaboratory() {
        List<Device> devices = List.of(new Device("Oscilloscope", null, laboratory));
        when(repository.findByLaboratoryId(2L)).thenReturn(devices);

        assertSame(devices, service.list(2L, null));
        verifyNoMoreInteractions(repository);
    }

    @Test
    void shouldListDevicesByStatus() {
        List<Device> devices = List.of(new Device("Oscilloscope", null, laboratory));
        when(repository.findByStatus(DeviceStatus.AVAILABLE)).thenReturn(devices);

        assertSame(devices, service.list(null, DeviceStatus.AVAILABLE));
        verifyNoMoreInteractions(repository);
    }

    @Test
    void shouldListDevicesByLaboratoryAndStatus() {
        List<Device> devices = List.of(new Device("Oscilloscope", null, laboratory));
        when(repository.findByLaboratoryIdAndStatus(2L, DeviceStatus.AVAILABLE)).thenReturn(devices);

        assertSame(devices, service.list(2L, DeviceStatus.AVAILABLE));
        verifyNoMoreInteractions(repository);
    }

    @Test
    void shouldUpdateDeviceStatus() {
        Device device = new Device("Oscilloscope", null, laboratory);
        when(repository.findById(5L)).thenReturn(Optional.of(device));
        when(repository.save(device)).thenReturn(device);

        Device updated = service.updateStatus(5L, DeviceStatus.MAINTENANCE);

        assertEquals(DeviceStatus.MAINTENANCE, updated.getStatus());
        verify(repository).save(device);
    }

    @Test
    void shouldRejectStatusUpdateWhenDeviceDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        DeviceNotFoundException exception = assertThrows(DeviceNotFoundException.class,
                () -> service.updateStatus(99L, DeviceStatus.BORROWED));

        assertEquals("Device not found", exception.getMessage());
        verify(repository, never()).save(any(Device.class));
    }

    @Test
    void shouldRejectNullStatus() {
        assertInvalidDevice("Device status must not be null",
                () -> service.updateStatus(5L, null));
    }
}
