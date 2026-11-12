package br.inatel.devices.repository;

import br.inatel.devices.model.Device;
import org.springframework.data.repository.Repository;

public interface DeviceRepository extends Repository<Device, Long> {

    Device save(Device device);
}
