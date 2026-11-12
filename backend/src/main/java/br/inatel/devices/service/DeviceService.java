package br.inatel.devices.service;

import br.inatel.devices.exception.InvalidDeviceException;
import br.inatel.devices.model.Device;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.labs.model.Laboratory;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {

    private final DeviceRepository repository;

    public DeviceService(DeviceRepository repository) {
        this.repository = repository;
    }

    public Device create(String name, String description, Laboratory laboratory) {
        if (name == null || name.isBlank()) {
            throw new InvalidDeviceException("Device name must not be blank");
        }
        if (laboratory == null) {
            throw new InvalidDeviceException("Laboratory must not be null");
        }

        return repository.save(new Device(name, description, laboratory));
    }
}
