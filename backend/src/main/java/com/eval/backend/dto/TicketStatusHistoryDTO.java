package com.eval.backend.dto;

import java.time.LocalDateTime;

public class TicketStatusHistoryDTO {
    private Long id;
    private Long ticketId;
    private Integer oldStatus;
    private Integer newStatus;
    private String changedBy;
    private String comment;
    private String solution;
    private LocalDateTime changedAt;

    // Constructors
    public TicketStatusHistoryDTO() {}

    public TicketStatusHistoryDTO(Long id, Long ticketId, Integer oldStatus, Integer newStatus,
                                    String changedBy, String comment, String solution, LocalDateTime changedAt) {
        this.id = id;
        this.ticketId = ticketId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.comment = comment;
        this.solution = solution;
        this.changedAt = changedAt;
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

    public Integer getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(Integer oldStatus) {
        this.oldStatus = oldStatus;
    }

    public Integer getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(Integer newStatus) {
        this.newStatus = newStatus;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getSolution() {
        return solution;
    }

    public void setSolution(String solution) {
        this.solution = solution;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }
}
