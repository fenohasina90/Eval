package com.eval.backend.controller;

import com.eval.backend.service.KanbanCustomizationService;
import com.eval.backend.service.TicketStatusHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reset")
@CrossOrigin(origins = "*")
public class ResetController {

    @Autowired
    private TicketStatusHistoryService historyService;

    @Autowired
    private KanbanCustomizationService customizationService;

    @DeleteMapping
    public void resetAll() {
        historyService.deleteAllHistory();
        customizationService.resetCustomization();
    }
}
