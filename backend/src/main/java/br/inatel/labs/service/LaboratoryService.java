package br.inatel.labs.service;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import org.springframework.stereotype.Service;

@Service
public class LaboratoryService {

    private final LaboratoryRepository repository;

    public LaboratoryService(LaboratoryRepository repository) {
        this.repository = repository;
    }

    public Laboratory create(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Laboratory name is required");
        }

        return repository.save(new Laboratory(name));
    }
}
