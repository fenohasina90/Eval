package com.eval.backend.controller;

import com.eval.backend.dto.KanbanCustomizationDTO;
import com.eval.backend.service.KanbanCustomizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kanban-customization")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class KanbanCustomizationController {

    private final KanbanCustomizationService service;

    @GetMapping
    public ResponseEntity<KanbanCustomizationDTO> getCustomization() {
        return ResponseEntity.ok(service.getCustomization());
    }

    @PutMapping
    public ResponseEntity<KanbanCustomizationDTO> saveCustomization(@RequestBody KanbanCustomizationDTO dto) {
        return ResponseEntity.ok(service.saveCustomization(dto));
    }

    @DeleteMapping
    public ResponseEntity<KanbanCustomizationDTO> resetCustomization() {
        return ResponseEntity.ok(service.resetCustomization());
    }
}
