package com.eval.backend.service;

import com.eval.backend.dto.TicketStatusHistoryDTO;
import com.eval.backend.entity.TicketStatusHistory;
import com.eval.backend.repository.TicketStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketStatusHistoryService {

    @Autowired
    private TicketStatusHistoryRepository repository;

    @Autowired
    @Lazy
    private SuperCoutService superCoutService;

    @Autowired
    @Lazy
    private CoutOuvertureService coutOuvertureService;

    public TicketStatusHistoryDTO createHistory(Long ticketId, Integer oldStatus, Integer newStatus,
                                                  String changedBy, String comment, String solution, Double superCout) {
        TicketStatusHistory history = new TicketStatusHistory();
        history.setTicketId(ticketId);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(changedBy);
        history.setComment(comment);
        history.setSolution(solution);
        history.setSuperCout(superCout);

        TicketStatusHistory saved = repository.save(history);
        return convertToDTO(saved);
    }

    public List<TicketStatusHistoryDTO> getHistoryForTicket(Long ticketId) {
        return repository.findByTicketIdOrderByChangedAtDesc(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<TicketStatusHistoryDTO> getToutesAnnulations() {
        return repository.findAll()
                .stream()
                .filter(h -> h.getComment() != null && h.getComment().contains("Annulation") && !h.getAnnulationRestoree())
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public TicketStatusHistoryDTO restaurerAnnulation(Long id) {
        return repository.findById(id).map(history -> {
            // Mark as restored
            history.setAnnulationRestoree(true);
            
            // Re-add the super cout (if present) at original time
            if (history.getSuperCout() != null) {
                superCoutService.createSuperCout(
                        history.getTicketId(),
                        history.getSuperCout(),
                        history.getChangedAt()
                );
            }
            
            // Recalculate all cout ouvertures after this date with mode 3 or 4
            var toutesReouvertures = coutOuvertureService.getCoutOuverturesByTicketId(history.getTicketId());
            for (var reouverture : toutesReouvertures) {
                if (reouverture.getCreatedAt().isAfter(history.getChangedAt()) &&
                    (reouverture.getMode().equals("3") || reouverture.getMode().equals("4"))) {
                    coutOuvertureService.recalculateCoutOuverture(reouverture.getId());
                }
            }
            
            return convertToDTO(repository.save(history));
        }).orElse(null);
    }

    public void deleteAllHistory() {
        repository.deleteAll();
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
                history.getSuperCout(),
                history.getAnnulationRestoree(),
                history.getChangedAt()
        );
    }
}
