package br.inatel.devices.dto;

import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;

/**
 * Flat representation of a device: the laboratory is exposed only by id and name,
 * never as a nested entity.
 */
public record DeviceResponse(
        Long id,
        String name,
        String description,
        DeviceStatus status,
        Long laboratoryId,
        String laboratoryName) {

    public static DeviceResponse from(Device device) {
        return new DeviceResponse(
                device.getId(),
                device.getName(),
                device.getDescription(),
                device.getStatus(),
                device.getLaboratory().getId(),
                device.getLaboratory().getName());
    }
}
