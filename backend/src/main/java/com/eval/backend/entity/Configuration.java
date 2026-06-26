package com.eval.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "configuration")
public class Configuration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cle", unique = true, nullable = false)
    private String cle;

    @Column(name = "valeur", nullable = false)
    private String valeur;

    public Configuration() {}

    public Configuration(String cle, String valeur) {
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
