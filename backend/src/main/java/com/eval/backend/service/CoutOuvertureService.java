package com.eval.backend.service;

import com.eval.backend.dto.CoutOuvertureDTO;
import com.eval.backend.entity.CoutOuverture;
import com.eval.backend.repository.CoutOuvertureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CoutOuvertureService {

  @Autowired
  private CoutOuvertureRepository repository;

  @Autowired
  @Lazy
  private SuperCoutService superCoutService;

  @Autowired
  private ConfigurationService configurationService;

    private Double calculerCoutOuvertureAvecPlafond(Long ticketId, Double coutCalculer, LocalDateTime dateReouverture) {
        // Get all super couts before this reouverture
        var allSuperCouts = superCoutService.getSuperCoutsByTicketId(ticketId);
        var superCoutsAvant = allSuperCouts.stream()
                .filter(sc -> sc.getCreatedAt() != null && !sc.getCreatedAt().isAfter(dateReouverture))
                .collect(Collectors.toList());
        
        // Calculate sum of super couts
        Double sommeSuperCouts = superCoutsAvant.stream().mapToDouble(sc -> sc.getCout()).sum();
        
        // Get plafond
        Double plafondPourcentage = Double.valueOf(configurationService.getPlafondReouverture().getValeur());
        Double plafondValeur = (sommeSuperCouts * plafondPourcentage) / 100;
        
        // Calculate sum of previous cout ouvertures for this ticket
        var toutesReouvertures = getCoutOuverturesByTicketId(ticketId);
        Double sommeReouverturesAvant = toutesReouvertures.stream()
                .filter(co -> co.getCreatedAt() != null && co.getCreatedAt().isBefore(dateReouverture))
                .mapToDouble(co -> co.getCoutOuverture())
                .sum();
        
        // Max possible is plafondValeur minus sommeReouverturesAvant
        Double maxReouverturePossible = Math.max(0, plafondValeur - sommeReouverturesAvant);
        
        // Return the minimum between calculated cout and max possible
        Double resultat = Math.min(coutCalculer, maxReouverturePossible);
        return Math.round(resultat * 1000.0) / 1000.0;
    }

    public CoutOuvertureDTO createCoutOuverture(Long ticketId, Double coutOuverture, Double pourcentage, Double superCoutInitial, String mode) {
        CoutOuverture coutOuvertureEntity = new CoutOuverture();
        coutOuvertureEntity.setTicketId(ticketId);
        
        // Calculate with plafond
        LocalDateTime maintenant = LocalDateTime.now();
        Double coutAvecPlafond = calculerCoutOuvertureAvecPlafond(ticketId, coutOuverture, maintenant);
        
        coutOuvertureEntity.setCoutOuverture(coutAvecPlafond);
        coutOuvertureEntity.setPourcentage(pourcentage);
        coutOuvertureEntity.setSuperCoutInitial(superCoutInitial);
        coutOuvertureEntity.setMode(mode != null ? mode : "1");
        coutOuvertureEntity.setCreatedAt(maintenant);

        CoutOuverture saved = repository.save(coutOuvertureEntity);
        return convertToDTO(saved);
    }

    public CoutOuvertureDTO getCoutOuvertureById(Long id) {
        return repository.findById(id).map(this::convertToDTO).orElse(null);
    }

    // Recalculates a cout ouverture using its own stored pourcentage and mode
    public CoutOuvertureDTO recalculateCoutOuverture(Long id) {
        return repository.findById(id).map(coutOuverture -> {
            // Get all super couts of the ticket created before this cout ouverture
            var allSuperCouts = superCoutService.getSuperCoutsByTicketId(coutOuverture.getTicketId());
            var superCoutsFiltres = allSuperCouts.stream()
                    .filter(sc -> sc.getCreatedAt() != null &&
                            (sc.getCreatedAt().isBefore(coutOuverture.getCreatedAt()) ||
                                    sc.getCreatedAt().isEqual(coutOuverture.getCreatedAt())))
                    .collect(Collectors.toList());

            // Calculate base super cout based on stored mode
            Double baseSuperCout = 0.0;
            if (superCoutsFiltres != null && !superCoutsFiltres.isEmpty()) {
                switch (coutOuverture.getMode()) {
                    case "1": // Dernier
                        baseSuperCout = superCoutsFiltres.get(superCoutsFiltres.size() - 1).getCout();
                        break;
                    case "2": // Premier
                        baseSuperCout = superCoutsFiltres.get(0).getCout();
                        break;
                    case "3": // Moyenne
                        double sum = 0;
                        for (var sc : superCoutsFiltres) sum += sc.getCout();
                        baseSuperCout = sum / superCoutsFiltres.size();
                        break;
                    case "4": // Somme
                        double total = 0;
                        for (var sc : superCoutsFiltres) total += sc.getCout();
                        baseSuperCout = total;
                        break;
                    default:
                        baseSuperCout = superCoutsFiltres.get(superCoutsFiltres.size() - 1).getCout();
                }
            } else if (coutOuverture.getSuperCoutInitial() != null) {
                baseSuperCout = coutOuverture.getSuperCoutInitial();
            }

            // Calculate new cout ouverture
            Double nouveauCoutOuverture = (baseSuperCout * coutOuverture.getPourcentage()) / 100;
            
            // Apply plafond
            Double coutAvecPlafond = calculerCoutOuvertureAvecPlafond(coutOuverture.getTicketId(), nouveauCoutOuverture, coutOuverture.getCreatedAt());

            // Update entity
            coutOuverture.setCoutOuverture(coutAvecPlafond);
            coutOuverture.setSuperCoutInitial(baseSuperCout);

            return convertToDTO(repository.save(coutOuverture));
        }).orElse(null);
    }

    public CoutOuvertureDTO updateCoutOuverture(Long id, Double pourcentage, String mode, Double superCoutInitial) {
        return repository.findById(id).map(coutOuverture -> {
            // Get all super couts of the ticket created before this cout ouverture
            var allSuperCouts = superCoutService.getSuperCoutsByTicketId(coutOuverture.getTicketId());
            var superCoutsFiltres = allSuperCouts.stream()
                    .filter(sc -> sc.getCreatedAt() != null &&
                            (sc.getCreatedAt().isBefore(coutOuverture.getCreatedAt()) ||
                                    sc.getCreatedAt().isEqual(coutOuverture.getCreatedAt())))
                    .collect(Collectors.toList());

            // Calculate base super cout based on new mode
            Double baseSuperCout = 0.0;
            if (superCoutsFiltres != null && !superCoutsFiltres.isEmpty()) {
                switch (mode) {
                    case "1": // Dernier
                        baseSuperCout = superCoutsFiltres.get(superCoutsFiltres.size() - 1).getCout();
                        break;
                    case "2": // Premier
                        baseSuperCout = superCoutsFiltres.get(0).getCout();
                        break;
                    case "3": // Moyenne
                        double sum = 0;
                        for (var sc : superCoutsFiltres) sum += sc.getCout();
                        baseSuperCout = sum / superCoutsFiltres.size();
                        break;
                    case "4": // Somme
                        double total = 0;
                        for (var sc : superCoutsFiltres) total += sc.getCout();
                        baseSuperCout = total;
                        break;
                    default:
                        baseSuperCout = superCoutsFiltres.get(superCoutsFiltres.size() - 1).getCout();
                }
            } else if (superCoutInitial != null) {
                baseSuperCout = superCoutInitial;
            }

            // Calculate new cout ouverture
            Double nouveauCoutOuverture = (baseSuperCout * pourcentage) / 100;
            
            // Apply plafond
            Double coutAvecPlafond = calculerCoutOuvertureAvecPlafond(coutOuverture.getTicketId(), nouveauCoutOuverture, coutOuverture.getCreatedAt());

            // Update entity
            coutOuverture.setPourcentage(pourcentage);
            coutOuverture.setMode(mode != null ? mode : "1");
            coutOuverture.setCoutOuverture(coutAvecPlafond);
            coutOuverture.setSuperCoutInitial(baseSuperCout);

            return convertToDTO(repository.save(coutOuverture));
        }).orElse(null);
    }

    public List<CoutOuvertureDTO> getCoutOuverturesByTicketId(Long ticketId) {
        return repository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CoutOuvertureDTO> getAllCoutOuvertures() {
        return repository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "createdAt"))
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteCoutOuverture(Long id) {
        repository.deleteById(id);
    }

    public void deleteAllCoutOuvertures() {
        repository.deleteAll();
    }

    private CoutOuvertureDTO convertToDTO(CoutOuverture coutOuverture) {
        return new CoutOuvertureDTO(
                coutOuverture.getId(),
                coutOuverture.getTicketId(),
                coutOuverture.getCoutOuverture(),
                coutOuverture.getPourcentage(),
                coutOuverture.getSuperCoutInitial(),
                coutOuverture.getMode(),
                coutOuverture.getCreatedAt()
        );
    }
}
