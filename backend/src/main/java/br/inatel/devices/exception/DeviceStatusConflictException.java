package br.inatel.devices.exception;

/**
 * Thrown when a manual status change is incompatible with the current state of the device,
 * e.g. releasing a device that still has an approved loan.
 */
public class DeviceStatusConflictException extends RuntimeException {
    public DeviceStatusConflictException(String message) {
        super(message);
    }
}
