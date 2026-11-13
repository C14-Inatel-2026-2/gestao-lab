package br.inatel.labs.repository;

import br.inatel.labs.model.Laboratory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LaboratoryRepository extends JpaRepository<Laboratory, Long> {
    @Query("select count(d) > 0 from Device d where d.laboratory.id = :id")
    boolean hasDevices(@Param("id") Long id);

    @Query("select count(l) > 0 from Loan l where l.laboratory.id = :id")
    boolean hasLoans(@Param("id") Long id);
}
