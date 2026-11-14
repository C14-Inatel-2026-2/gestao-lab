package br.inatel.labs;

import br.inatel.labs.exception.InvalidLaboratoryException;
import br.inatel.labs.exception.LaboratoryNotFoundException;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import br.inatel.labs.service.LaboratoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
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

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void shouldRejectInvalidNameWhenCreating(String name) {
        InvalidLaboratoryException exception = assertThrows(
                InvalidLaboratoryException.class, () -> service.create(name));

        assertEquals("Laboratory name is required", exception.getMessage());
        verifyNoInteractions(repository);
    }

    @Test
    void shouldFindLaboratoryById() {
        Laboratory savedLaboratory = new Laboratory("Laboratorio de Software");
        when(repository.findById(1L)).thenReturn(Optional.of(savedLaboratory));

        Laboratory laboratory = service.findById(1L);

        assertSame(savedLaboratory, laboratory);
        verify(repository).findById(1L);
    }

    @Test
    void shouldRejectUnknownLaboratoryId() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        LaboratoryNotFoundException exception = assertThrows(
                LaboratoryNotFoundException.class, () -> service.findById(1L));

        assertEquals("Laboratory not found", exception.getMessage());
        verify(repository).findById(1L);
    }

    @Test
    void shouldUpdateExistingLaboratory() {
        Laboratory laboratory = new Laboratory("Nome antigo");
        when(repository.findById(1L)).thenReturn(Optional.of(laboratory));
        when(repository.save(laboratory)).thenReturn(laboratory);

        Laboratory updated = service.update(1L, "Nome atualizado");

        assertSame(laboratory, updated);
        assertEquals("Nome atualizado", updated.getName());
        verify(repository).save(laboratory);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void shouldRejectInvalidNameWhenUpdating(String name) {
        InvalidLaboratoryException exception = assertThrows(
                InvalidLaboratoryException.class, () -> service.update(1L, name));

        assertEquals("Laboratory name is required", exception.getMessage());
        verifyNoInteractions(repository);
    }

    @Test
    void shouldRejectUpdateOfUnknownLaboratory() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        LaboratoryNotFoundException exception = assertThrows(
                LaboratoryNotFoundException.class, () -> service.update(1L, "Lab Software"));

        assertEquals("Laboratory not found", exception.getMessage());
        verify(repository, never()).save(any(Laboratory.class));
    }
}
