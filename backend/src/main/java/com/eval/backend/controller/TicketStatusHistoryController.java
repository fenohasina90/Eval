package com.eval.backend.controller;

import com.eval.backend.dto.TicketStatusHistoryDTO;
import com.eval.backend.service.TicketStatusHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ticket-history")
@CrossOrigin(origins = "*")
public class TicketStatusHistoryController {

    @Autowired
    private TicketStatusHistoryService service;

    @GetMapping("/ticket/{ticketId}")
    public List<TicketStatusHistoryDTO> getHistoryForTicket(@PathVariable Long ticketId) {
        return service.getHistoryForTicket(ticketId);
    }

    @GetMapping("/annulations")
    public List<TicketStatusHistoryDTO> getToutesAnnulations() {
        return service.getToutesAnnulations();
    }

    @PostMapping("/restaurer-annulation/{id}")
    public TicketStatusHistoryDTO restaurerAnnulation(@PathVariable Long id) {
        return service.restaurerAnnulation(id);
    }

    @PostMapping
    public TicketStatusHistoryDTO createHistory(@RequestBody Map<String, Object> request) {
        Long ticketId = Long.valueOf(request.get("ticketId").toString());
        Integer oldStatus = request.get("oldStatus") != null ? Integer.valueOf(request.get("oldStatus").toString()) : null;
        Integer newStatus = Integer.valueOf(request.get("newStatus").toString());
        String changedBy = (String) request.get("changedBy");
        String comment = (String) request.get("comment");
        String solution = (String) request.get("solution");
        Double superCout = request.get("superCout") != null ? Double.valueOf(request.get("superCout").toString()) : null;

        return service.createHistory(ticketId, oldStatus, newStatus, changedBy, comment, solution, superCout);
    }

    @DeleteMapping
    public void deleteAllHistory() {
        service.deleteAllHistory();
    }
}
