package br.inatel.labs;

import br.inatel.labs.model.Laboratory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LaboratoryTest {

    @Test
    void shouldKeepLaboratoryName() {
        Laboratory laboratory = new Laboratory("Laboratorio de Software");

        assertEquals("Laboratorio de Software", laboratory.getName());
    }

    @Test
    void shouldStartWithoutId() {
        Laboratory laboratory = new Laboratory("Laboratorio de Software");

        assertNull(laboratory.getId());
    }
}
