package br.inatel.devices.controller;

import br.inatel.devices.dto.DeviceRequest;
import br.inatel.devices.dto.DeviceResponse;
import br.inatel.devices.dto.DeviceStatusRequest;
import br.inatel.devices.model.Device;
import br.inatel.devices.model.DeviceStatus;
import br.inatel.devices.service.DeviceService;
import br.inatel.labs.model.Laboratory;
import br.inatel.labs.service.LaboratoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller handling device endpoints.
 * It only translates HTTP to service calls; business rules live in {@link DeviceService}.
 * Registering devices and changing their status is restricted to administrators.
 */
@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;
    private final LaboratoryService laboratoryService;

    public DeviceController(DeviceService deviceService, LaboratoryService laboratoryService) {
        this.deviceService = deviceService;
        this.laboratoryService = laboratoryService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeviceResponse> create(@Valid @RequestBody DeviceRequest request) {
        Laboratory laboratory = laboratoryService.findById(request.laboratoryId());

        Device device = deviceService.create(request.name(), request.description(), laboratory);

        return ResponseEntity.status(201).body(DeviceResponse.from(device));
    }

    @GetMapping
    public List<DeviceResponse> list(@RequestParam(required = false) Long laboratoryId,
                                     @RequestParam(required = false) DeviceStatus status) {
        return deviceService.list(laboratoryId, status).stream()
                .map(DeviceResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public DeviceResponse updateStatus(@PathVariable Long id,
                                       @Valid @RequestBody DeviceStatusRequest request) {
        return DeviceResponse.from(deviceService.updateStatus(id, request.status()));
    }
}
