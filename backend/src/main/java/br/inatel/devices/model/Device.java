package br.inatel.devices.model;

public class Device {

    private Long id;
    private String name;
    private DeviceStatus status;

    public Device(String name) {
        this.name = name;
        this.status = DeviceStatus.AVAILABLE;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public DeviceStatus getStatus() {
        return status;
    }

    public void setStatus(DeviceStatus status) {
        this.status = status;
    }
}
