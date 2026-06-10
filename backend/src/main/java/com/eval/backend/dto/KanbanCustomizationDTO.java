package com.eval.backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class KanbanCustomizationDTO {
    private Map<Integer, String> colorsByStatus;
    private Map<Integer, String> labelsByStatus;
}
