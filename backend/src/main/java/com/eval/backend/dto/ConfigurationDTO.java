package com.eval.backend.dto;

public class ConfigurationDTO {
    private Long id;
    private String cle;
    private String valeur;

    public ConfigurationDTO() {}

    public ConfigurationDTO(Long id, String cle, String valeur) {
        this.id = id;
        this.cle = cle;
        this.valeur = valeur;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCle() { return cle; }
    public void setCle(String cle) { this.cle = cle; }
    public String getValeur() { return valeur; }
    public void setValeur(String valeur) { this.valeur = valeur; }
}
