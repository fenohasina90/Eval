package com.eval.backend.service;

import com.eval.backend.dto.SuperCoutDTO;
import com.eval.backend.entity.SuperCout;
import com.eval.backend.repository.SuperCoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SuperCoutService {

    @Autowired
    private SuperCoutRepository repository;

    public SuperCoutDTO createSuperCout(Long ticketId, Double cout) {
        SuperCout superCout = new SuperCout();
        superCout.setTicketId(ticketId);
        superCout.setCout(cout);

        SuperCout saved = repository.save(superCout);
        return convertToDTO(saved);
    }

    public List<SuperCoutDTO> getSuperCoutsByTicketId(Long ticketId) {
        return repository.findByTicketId(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SuperCoutDTO> getAllSuperCouts() {
        return repository.findAll()
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
                superCout.getCout()
        );
    }
}
