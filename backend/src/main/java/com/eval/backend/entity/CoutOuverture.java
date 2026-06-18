package com.eval.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "cout_ouverture")
public class CoutOuverture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "cout_ouverture", nullable = false)
    private Double coutOuverture;

    @Column(name = "pourcentage", nullable = false)
    private Double pourcentage;

    @Column(name = "super_cout_initial", nullable = false)
    private Double superCoutInitial;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

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

    public LocalDateTime getCreatedAt(){
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
