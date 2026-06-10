package com.eval.backend.service;

import com.eval.backend.dto.KanbanCustomizationDTO;
import com.eval.backend.entity.KanbanCustomization;
import com.eval.backend.repository.KanbanCustomizationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KanbanCustomizationService {

    private final KanbanCustomizationRepository repository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<Integer, String> DEFAULT_COLORS = Map.of(
            1, "blue",
            2, "amber",
            6, "green"
    );

    private static final Map<Integer, String> DEFAULT_LABELS = Map.of(
            1, "Nouveau",
            2, "En cours (Attribué)",
            6, "Terminé (Clos)"
    );

    public KanbanCustomizationDTO getCustomization() {
        List<KanbanCustomization> all = repository.findAll();
        if (all.isEmpty()) {
            return createDefaultDTO();
        }
        KanbanCustomization entity = all.get(0);
        return entityToDTO(entity);
    }

    public KanbanCustomizationDTO saveCustomization(KanbanCustomizationDTO dto) {
        List<KanbanCustomization> all = repository.findAll();
        KanbanCustomization entity = all.isEmpty() ? new KanbanCustomization() : all.get(0);
        dtoToEntity(dto, entity);
        KanbanCustomization saved = repository.save(entity);
        return entityToDTO(saved);
    }

    public KanbanCustomizationDTO resetCustomization() {
        repository.deleteAll();
        return createDefaultDTO();
    }

    private KanbanCustomizationDTO createDefaultDTO() {
        KanbanCustomizationDTO dto = new KanbanCustomizationDTO();
        dto.setColorsByStatus(new HashMap<>(DEFAULT_COLORS));
        dto.setLabelsByStatus(new HashMap<>(DEFAULT_LABELS));
        return dto;
    }

    private KanbanCustomizationDTO entityToDTO(KanbanCustomization entity) {
        KanbanCustomizationDTO dto = new KanbanCustomizationDTO();
        try {
            if (entity.getColorsByStatus() != null) {
                Map<Integer, String> colors = objectMapper.readValue(
                        entity.getColorsByStatus(),
                        new TypeReference<Map<Integer, String>>() {}
                );
                dto.setColorsByStatus(colors);
            } else {
                dto.setColorsByStatus(new HashMap<>(DEFAULT_COLORS));
            }

            if (entity.getLabelsByStatus() != null) {
                Map<Integer, String> labels = objectMapper.readValue(
                        entity.getLabelsByStatus(),
                        new TypeReference<Map<Integer, String>>() {}
                );
                dto.setLabelsByStatus(labels);
            } else {
                dto.setLabelsByStatus(new HashMap<>(DEFAULT_LABELS));
            }
        } catch (Exception e) {
            dto.setColorsByStatus(new HashMap<>(DEFAULT_COLORS));
            dto.setLabelsByStatus(new HashMap<>(DEFAULT_LABELS));
        }
        return dto;
    }

    private void dtoToEntity(KanbanCustomizationDTO dto, KanbanCustomization entity) {
        try {
            entity.setColorsByStatus(objectMapper.writeValueAsString(dto.getColorsByStatus()));
            entity.setLabelsByStatus(objectMapper.writeValueAsString(dto.getLabelsByStatus()));
        } catch (Exception e) {
            throw new RuntimeException("Error converting DTO to JSON", e);
        }
    }
}
