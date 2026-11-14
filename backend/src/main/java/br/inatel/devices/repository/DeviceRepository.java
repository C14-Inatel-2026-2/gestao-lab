package br.inatel.devices.repository;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends Repository<Device, Long> {

    Device save(Device device);

    Optional<Device> findById(Long id);

    List<Device> findAll();

    List<Device> findByLaboratoryId(Long laboratoryId);

    List<Device> findByStatus(DeviceStatus status);

    List<Device> findByLaboratoryIdAndStatus(Long laboratoryId, DeviceStatus status);

    /**
     * True while the device is committed to at least one approved loan that was not returned yet.
     */
    @Query("select count(l) > 0 from Loan l "
            + "where l.device.id = :id and l.status = br.inatel.loans.model.LoanStatus.APPROVED")
    boolean hasApprovedLoans(@Param("id") Long id);
}
