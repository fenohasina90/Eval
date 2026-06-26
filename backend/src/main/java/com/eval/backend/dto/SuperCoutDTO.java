package com.eval.backend.dto;

import java.time.LocalDateTime;

public class SuperCoutDTO {
    private Long id;
    private Long ticketId;
    private Double cout;
    private LocalDateTime createdAt;

    // Constructors
    public SuperCoutDTO() {}

    public SuperCoutDTO(Long id, Long ticketId, Double cout, LocalDateTime createdAt) {
        this.id = id;
        this.ticketId = ticketId;
        this.cout = cout;
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

    public Double getCout() {
        return cout;
    }

    public void setCout(Double cout) {
        this.cout = cout;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
