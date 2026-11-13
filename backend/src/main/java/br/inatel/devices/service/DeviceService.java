package br.inatel.devices.service;

import br.inatel.devices.exception.DeviceNotFoundException;
import br.inatel.devices.exception.InvalidDeviceException;
import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.repository.DeviceRepository;
import br.inatel.labs.model.Laboratory;
import org.springframework.stereotype.Service;

import java.util.List;

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

    /**
     * Lists devices; both filters are optional and can be combined.
     */
    public List<Device> list(Long laboratoryId, DeviceStatus status) {
        if (laboratoryId != null && status != null) {
            return repository.findByLaboratoryIdAndStatus(laboratoryId, status);
        }
        if (laboratoryId != null) {
            return repository.findByLaboratoryId(laboratoryId);
        }
        if (status != null) {
            return repository.findByStatus(status);
        }
        return repository.findAll();
    }

    public Device findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new DeviceNotFoundException("Device not found"));
    }

    public Device updateStatus(Long id, DeviceStatus status) {
        if (status == null) {
            throw new InvalidDeviceException("Device status must not be null");
        }

        Device device = repository.findById(id)
                .orElseThrow(() -> new DeviceNotFoundException("Device not found"));
        device.setStatus(status);

        return repository.save(device);
    }
}
