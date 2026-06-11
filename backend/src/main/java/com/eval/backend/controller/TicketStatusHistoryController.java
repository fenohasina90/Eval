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

    @PostMapping
    public TicketStatusHistoryDTO createHistory(@RequestBody Map<String, Object> request) {
        Long ticketId = Long.valueOf(request.get("ticketId").toString());
        Integer oldStatus = request.get("oldStatus") != null ? Integer.valueOf(request.get("oldStatus").toString()) : null;
        Integer newStatus = Integer.valueOf(request.get("newStatus").toString());
        String changedBy = (String) request.get("changedBy");
        String comment = (String) request.get("comment");
        String solution = (String) request.get("solution");

        return service.createHistory(ticketId, oldStatus, newStatus, changedBy, comment, solution);
    }

    @DeleteMapping
    public void deleteAllHistory() {
        service.deleteAllHistory();
    }
}
