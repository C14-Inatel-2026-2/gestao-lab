package br.inatel.devices.dto;

import br.inatel.devices.model.DeviceStatus;
import jakarta.validation.constraints.NotNull;

public record DeviceStatusRequest(
        @NotNull(message = "Device status must not be null") DeviceStatus status) {
}
