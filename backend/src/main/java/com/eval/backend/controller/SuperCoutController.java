package com.eval.backend.controller;

import com.eval.backend.dto.SuperCoutDTO;
import com.eval.backend.service.SuperCoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super-cout")
@CrossOrigin(origins = "*")
public class SuperCoutController {

    @Autowired
    private SuperCoutService service;

    @GetMapping
    public List<SuperCoutDTO> getAllSuperCouts() {
        return service.getAllSuperCouts();
    }

    @GetMapping("/ticket/{ticketId}")
    public List<SuperCoutDTO> getSuperCoutsByTicketId(@PathVariable Long ticketId) {
        return service.getSuperCoutsByTicketId(ticketId);
    }

    @GetMapping("/{id}")
    public SuperCoutDTO getSuperCoutById(@PathVariable Long id) {
        return service.getSuperCoutById(id);
    }

    @PostMapping
    public SuperCoutDTO createSuperCout(@RequestBody Map<String, Object> request) {
        Long ticketId = Long.valueOf(request.get("ticketId").toString());
        Double cout = Double.valueOf(request.get("cout").toString());
        return service.createSuperCout(ticketId, cout);
    }

    @PutMapping("/{id}")
    public SuperCoutDTO updateSuperCout(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Double cout = Double.valueOf(request.get("cout").toString());
        return service.updateSuperCout(id, cout);
    }

    @DeleteMapping("/{id}")
    public void deleteSuperCout(@PathVariable Long id) {
        service.deleteSuperCout(id);
    }

    @DeleteMapping
    public void deleteAllSuperCouts() {
        service.deleteAllSuperCouts();
    }
}
