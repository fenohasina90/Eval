package com.eval.backend.controller;

import com.eval.backend.dto.CoutOuvertureDTO;
import com.eval.backend.service.CoutOuvertureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cout-ouverture")
@CrossOrigin(origins = "*")
public class CoutOuvertureController {

    @Autowired
    private CoutOuvertureService service;

    @GetMapping
    public List<CoutOuvertureDTO> getAllCoutOuvertures() {
        return service.getAllCoutOuvertures();
    }

    @GetMapping("/ticket/{ticketId}")
    public List<CoutOuvertureDTO> getCoutOuverturesByTicketId(@PathVariable Long ticketId) {
        return service.getCoutOuverturesByTicketId(ticketId);
    }

    @PostMapping
    public CoutOuvertureDTO createCoutOuverture(@RequestBody Map<String, Object> request) {
        Long ticketId = Long.valueOf(request.get("ticketId").toString());
        Double coutOuverture = Double.valueOf(request.get("coutOuverture").toString());
        Double pourcentage = Double.valueOf(request.get("pourcentage").toString());
        Double superCoutInitial = Double.valueOf(request.get("superCoutInitial").toString());
        return service.createCoutOuverture(ticketId, coutOuverture, pourcentage, superCoutInitial);
    }

    @DeleteMapping("/{id}")
    public void deleteCoutOuverture(@PathVariable Long id) {
        service.deleteCoutOuverture(id);
    }

    @DeleteMapping
    public void deleteAllCoutOuvertures() {
        service.deleteAllCoutOuvertures();
    }
}
