package br.inatel.devices.model;

public class DeviceModel {
    private Long id;
    private String nome;
    private Status status;

    public enum Status {
        DISPONIVEL,
        EM_USO,
        MANUTENCAO
    }

    public DeviceModel(Long id, String nome) {
        this.id = id;
        this.nome = nome;
        this.status = Status.DISPONIVEL;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}