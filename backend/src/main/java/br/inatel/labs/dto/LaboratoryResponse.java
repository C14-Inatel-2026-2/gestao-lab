package br.inatel.labs.dto;

import br.inatel.labs.model.Laboratory;

public record LaboratoryResponse(Long id, String name) {
    public static LaboratoryResponse from(Laboratory laboratory) {
        return new LaboratoryResponse(laboratory.getId(), laboratory.getName());
    }
}
