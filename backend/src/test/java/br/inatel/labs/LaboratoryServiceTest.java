package br.inatel.labs;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.labs.service.LaboratoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LaboratoryServiceTest {

    @Mock
    private LaboratoryRepository repository;

    private LaboratoryService service;

    @BeforeEach
    void setUp() {
        service = new LaboratoryService(repository);
    }

    @Test
    void shouldCreateLaboratory() {
        when(repository.save(any(Laboratory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Laboratory laboratory = service.create("Laboratorio de Software");

        assertEquals("Laboratorio de Software", laboratory.getName());
        verify(repository).save(laboratory);
    }

    @Test
    void shouldReturnSavedLaboratory() {
        Laboratory savedLaboratory = new Laboratory("Laboratorio de Software");
        when(repository.save(any(Laboratory.class))).thenReturn(savedLaboratory);

        Laboratory laboratory = service.create("Laboratorio de Software");

        assertSame(savedLaboratory, laboratory);
    }

    @Test
    void shouldRejectNullName() {
        assertThrows(IllegalArgumentException.class, () -> service.create(null));

        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectEmptyName() {
        assertThrows(IllegalArgumentException.class, () -> service.create(""));

        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectBlankName() {
        assertThrows(IllegalArgumentException.class, () -> service.create("   "));

        verifyNoInteractions(repository);
    }
}
