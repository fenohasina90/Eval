package com.eval.backend.controller;

import com.eval.backend.dto.ConfigurationDTO;
import com.eval.backend.service.ConfigurationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/configuration")
@CrossOrigin(origins = "*")
public class ConfigurationController {

    @Autowired
    private ConfigurationService service;

    @GetMapping("/plafond-reouverture")
    public ConfigurationDTO getPlafondReouverture() {
        return service.getPlafondReouverture();
    }

    @PutMapping("/plafond-reouverture")
    public ConfigurationDTO setPlafondReouverture(@RequestBody Map<String, Object> request) {
        Double valeur = Double.valueOf(request.get("valeur").toString());
        return service.setPlafondReouverture(valeur);
    }
}
