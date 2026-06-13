package com.eval.backend.service;

import com.eval.backend.dto.CoutOuvertureDTO;
import com.eval.backend.entity.CoutOuverture;
import com.eval.backend.repository.CoutOuvertureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CoutOuvertureService {

    @Autowired
    private CoutOuvertureRepository repository;

    public CoutOuvertureDTO createCoutOuverture(Long ticketId, Double coutOuverture, Double pourcentage, Double superCoutInitial) {
        CoutOuverture coutOuvertureEntity = new CoutOuverture();
        coutOuvertureEntity.setTicketId(ticketId);
        coutOuvertureEntity.setCoutOuverture(coutOuverture);
        coutOuvertureEntity.setPourcentage(pourcentage);
        coutOuvertureEntity.setSuperCoutInitial(superCoutInitial);

        CoutOuverture saved = repository.save(coutOuvertureEntity);
        return convertToDTO(saved);
    }

    public List<CoutOuvertureDTO> getCoutOuverturesByTicketId(Long ticketId) {
        return repository.findByTicketId(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CoutOuvertureDTO> getAllCoutOuvertures() {
        return repository.findAll()
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
                coutOuverture.getSuperCoutInitial()
        );
    }
}
