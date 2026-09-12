package br.inatel.devices.model;

public class Device {
    private String nome;
    private String status;

    public Device(String nome) {
        this.nome = nome;
        this.status = "DISPONIVEL";
    }

    public String getNome() {
        return nome;
    }

    public String getStatus() {
        return status;
    }
}