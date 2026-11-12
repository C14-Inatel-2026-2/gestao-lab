package br.inatel.devices;

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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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
}
