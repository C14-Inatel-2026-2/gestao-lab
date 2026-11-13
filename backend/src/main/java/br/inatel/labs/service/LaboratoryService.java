package br.inatel.labs.service;

import br.inatel.labs.model.Laboratory;
import br.inatel.labs.repository.LaboratoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LaboratoryService {

    private final LaboratoryRepository repository;

    public LaboratoryService(LaboratoryRepository repository) {
        this.repository = repository;
    }

    public Laboratory create(String name) {
        validateName(name);
        return repository.save(new Laboratory(name));
    }

    public Laboratory findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Laboratory not found"));
    }

    @Transactional
    public Laboratory update(Long id, String name) {
        validateName(name);
        Laboratory laboratory = findById(id);
        laboratory.setName(name);
        return repository.save(laboratory);
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Laboratory name is required");
        }
    }
}
