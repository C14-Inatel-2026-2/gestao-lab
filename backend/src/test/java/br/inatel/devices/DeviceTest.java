package br.inatel.devices;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class DeviceTest {

    @Test
    void shouldStartAsAvailable() {
        Device device = new Device("Oscilloscope");
        assertEquals(DeviceStatus.AVAILABLE, device.getStatus());
    }

    @Test
    void shouldAllowStatusChange() {
        Device device = new Device("Oscilloscope");
        device.setStatus(DeviceStatus.BORROWED);
        assertEquals(DeviceStatus.BORROWED, device.getStatus());
    }
}