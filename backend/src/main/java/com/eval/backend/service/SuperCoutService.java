package com.eval.backend.service;

import com.eval.backend.dto.SuperCoutDTO;
import com.eval.backend.entity.SuperCout;
import com.eval.backend.repository.SuperCoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SuperCoutService {

  @Autowired
  private SuperCoutRepository repository;

  @Autowired
  @Lazy
  private CoutOuvertureService coutOuvertureService;

    public SuperCoutDTO createSuperCout(Long ticketId, Double cout) {
        return createSuperCout(ticketId, cout, LocalDateTime.now());
    }
    
    public SuperCoutDTO createSuperCout(Long ticketId, Double cout, LocalDateTime createdAt) {
        SuperCout superCout = new SuperCout();
        superCout.setTicketId(ticketId);
        superCout.setCout(cout);
        superCout.setCreatedAt(createdAt);

        SuperCout saved = repository.save(superCout);
        return convertToDTO(saved);
    }

    public SuperCoutDTO getSuperCoutById(Long id) {
        return repository.findById(id).map(this::convertToDTO).orElse(null);
    }

    public SuperCoutDTO updateSuperCout(Long id, Double cout) {
        return repository.findById(id).map(superCout -> {
            superCout.setCout(cout);
            SuperCout saved = repository.save(superCout);

            // Recalculate all cout ouvertures that come after this super cout and have mode 3 or 4
            recalculateRelevantCoutOuvertures(saved);

            return convertToDTO(saved);
        }).orElse(null);
    }

    private void recalculateRelevantCoutOuvertures(SuperCout superCout) {
        // Get all cout ouvertures for the same ticket
        var allCoutOuvertures = coutOuvertureService.getCoutOuverturesByTicketId(superCout.getTicketId());

        // Filter those that are after this super cout and have mode 3 or 4
        var relevantCoutOuvertures = allCoutOuvertures.stream()
                .filter(co -> co.getCreatedAt() != null && co.getCreatedAt().isAfter(superCout.getCreatedAt()))
                .filter(co -> co.getMode() != null && (co.getMode().equals("3") || co.getMode().equals("4")))
                .collect(Collectors.toList());

        // Recalculate each relevant cout ouverture
        for (var co : relevantCoutOuvertures) {
            coutOuvertureService.recalculateCoutOuverture(co.getId());
        }
    }

    public List<SuperCoutDTO> getSuperCoutsByTicketId(Long ticketId) {
        return repository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SuperCoutDTO> getAllSuperCouts() {
        return repository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "createdAt"))
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteSuperCout(Long id) {
        repository.deleteById(id);
    }

    public void deleteAllSuperCouts() {
        repository.deleteAll();
    }

    private SuperCoutDTO convertToDTO(SuperCout superCout) {
        return new SuperCoutDTO(
                superCout.getId(),
                superCout.getTicketId(),
                superCout.getCout(),
                superCout.getCreatedAt()
        );
    }
}
