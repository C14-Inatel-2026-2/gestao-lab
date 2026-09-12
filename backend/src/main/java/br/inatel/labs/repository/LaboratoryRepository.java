package br.inatel.labs.repository;

import br.inatel.labs.model.Laboratory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LaboratoryRepository extends JpaRepository<Laboratory, Long> {
}
