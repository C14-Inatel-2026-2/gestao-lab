package br.inatel.devices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeviceRequest(
        @NotBlank(message = "Device name must not be blank") String name,
        String description,
        @NotNull(message = "Laboratory id must not be null") Long laboratoryId) {
}
