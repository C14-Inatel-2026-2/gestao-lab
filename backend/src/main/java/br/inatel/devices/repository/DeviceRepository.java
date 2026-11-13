package br.inatel.devices.repository;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends Repository<Device, Long> {

    Device save(Device device);

    Optional<Device> findById(Long id);

    List<Device> findAll();

    List<Device> findByLaboratoryId(Long laboratoryId);

    List<Device> findByStatus(DeviceStatus status);

    List<Device> findByLaboratoryIdAndStatus(Long laboratoryId, DeviceStatus status);
}
