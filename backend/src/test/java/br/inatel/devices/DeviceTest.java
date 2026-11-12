package br.inatel.devices;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.labs.model.Laboratory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class DeviceTest {

    private Laboratory laboratory;

    @BeforeEach
    void setUp() {
        laboratory = new Laboratory("Electrical Lab");
    }

    @Test
    void shouldStartAsAvailable() {
        Device device = new Device("Oscilloscope", null, laboratory);
        assertEquals(DeviceStatus.AVAILABLE, device.getStatus());
    }

    @Test
    void shouldKeepNameDescriptionAndLaboratory() {
        Device device = new Device("Oscilloscope", "Digital oscilloscope", laboratory);

        assertEquals("Oscilloscope", device.getName());
        assertEquals("Digital oscilloscope", device.getDescription());
        assertSame(laboratory, device.getLaboratory());
    }

    @Test
    void shouldAllowMissingDescription() {
        Device device = new Device("Oscilloscope", null, laboratory);
        assertNull(device.getDescription());
    }

    @Test
    void shouldAllowStatusChange() {
        Device device = new Device("Oscilloscope", null, laboratory);
        device.setStatus(DeviceStatus.BORROWED);
        assertEquals(DeviceStatus.BORROWED, device.getStatus());
    }
}
