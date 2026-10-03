package br.inatel.labs;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.labs.service.LaboratoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
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
        String name = "Laboratorio de Software";
        Laboratory savedLaboratory = new Laboratory(name);
        when(repository.save(any(Laboratory.class))).thenReturn(savedLaboratory);

        Laboratory laboratory = service.create(name);

        assertSame(savedLaboratory, laboratory);
        verify(repository).save(argThat(saved -> name.equals(saved.getName())));
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
