package br.inatel.devices.repository;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import org.springframework.data.jpa.repository.Modifying;
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
     * Marks the device as AVAILABLE only if it has no approved loan, in a single statement.
     * Checking and updating together is what makes the release atomic with respect to loan
     * approvals: there is no gap between the check and the write for an approval to slip into.
     *
     * @return 1 when the device was released, 0 when an approved loan blocked it
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Device d set d.status = br.inatel.devices.model.DeviceStatus.AVAILABLE "
            + "where d.id = :id and not exists (select 1 from Loan l "
            + "where l.device.id = d.id and l.status = br.inatel.loans.model.LoanStatus.APPROVED)")
    int releaseUnlessApprovedLoan(@Param("id") Long id);
}
