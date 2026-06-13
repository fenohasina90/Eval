package com.eval.backend.dto;

public class CoutOuvertureDTO {
    private Long id;
    private Long ticketId;
    private Double coutOuverture;
    private Double pourcentage;
    private Double superCoutInitial;

    // Constructors
    public CoutOuvertureDTO() {}

    public CoutOuvertureDTO(Long id, Long ticketId, Double coutOuverture, Double pourcentage, Double superCoutInitial) {
        this.id = id;
        this.ticketId = ticketId;
        this.coutOuverture = coutOuverture;
        this.pourcentage = pourcentage;
        this.superCoutInitial = superCoutInitial;
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
}
