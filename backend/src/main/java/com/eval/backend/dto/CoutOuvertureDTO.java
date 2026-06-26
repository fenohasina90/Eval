package com.eval.backend.dto;

import java.time.LocalDateTime;

public class CoutOuvertureDTO {
    private Long id;
    private Long ticketId;
    private Double coutOuverture;
    private Double pourcentage;
    private Double superCoutInitial;
    private String mode;
    private LocalDateTime createdAt;

    // Constructors
    public CoutOuvertureDTO() {}

    public CoutOuvertureDTO(Long id, Long ticketId, Double coutOuverture, Double pourcentage, Double superCoutInitial, String mode, LocalDateTime createdAt) {
        this.id = id;
        this.ticketId = ticketId;
        this.coutOuverture = coutOuverture;
        this.pourcentage = pourcentage;
        this.superCoutInitial = superCoutInitial;
        this.mode = mode;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTicketId() {
        return ticketId;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public Double getCoutOuverture() {
        return coutOuverture;
    }

    public void setCoutOuverture(Double coutOuverture) {
        this.coutOuverture = coutOuverture;
    }

    public Double getPourcentage() {
        return pourcentage;
    }

    public void setPourcentage(Double pourcentage) {
        this.pourcentage = pourcentage;
    }

    public Double getSuperCoutInitial() {
        return superCoutInitial;
    }

    public void setSuperCoutInitial(Double superCoutInitial) {
        this.superCoutInitial = superCoutInitial;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
