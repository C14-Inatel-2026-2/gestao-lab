package br.inatel.devices;

import br.inatel.devices.model.Device;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class DeviceTest {

    @Test
    void testeCriarDispositivo() {
        Device d = new Device("Osciloscopio");
        assertEquals("DISPONIVEL", d.getStatus());
    }
}