package com.eval.backend.service;

import com.eval.backend.dto.TicketStatusHistoryDTO;
import com.eval.backend.entity.TicketStatusHistory;
import com.eval.backend.repository.TicketStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketStatusHistoryService {

    @Autowired
    private TicketStatusHistoryRepository repository;

    public TicketStatusHistoryDTO createHistory(Long ticketId, Integer oldStatus, Integer newStatus,
                                                  String changedBy, String comment, String solution) {
        TicketStatusHistory history = new TicketStatusHistory();
        history.setTicketId(ticketId);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(changedBy);
        history.setComment(comment);
        history.setSolution(solution);

        TicketStatusHistory saved = repository.save(history);
        return convertToDTO(saved);
    }

    public List<TicketStatusHistoryDTO> getHistoryForTicket(Long ticketId) {
        return repository.findByTicketIdOrderByChangedAtDesc(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private TicketStatusHistoryDTO convertToDTO(TicketStatusHistory history) {
        return new TicketStatusHistoryDTO(
                history.getId(),
                history.getTicketId(),
                history.getOldStatus(),
                history.getNewStatus(),
                history.getChangedBy(),
                history.getComment(),
                history.getSolution(),
                history.getChangedAt()
        );
    }
}
