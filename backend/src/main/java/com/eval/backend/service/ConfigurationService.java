package com.eval.backend.service;

import com.eval.backend.dto.ConfigurationDTO;
import com.eval.backend.entity.Configuration;
import com.eval.backend.repository.ConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ConfigurationService {

    @Autowired
    private ConfigurationRepository repository;

    private static final String CLE_PLAFOND_REOUVERTURE = "plafond_reouverture";

    public ConfigurationDTO getPlafondReouverture() {
        Optional<Configuration> opt = repository.findByCle(CLE_PLAFOND_REOUVERTURE);
        if (opt.isPresent()) {
            return convertToDTO(opt.get());
        } else {
            Configuration config = new Configuration(CLE_PLAFOND_REOUVERTURE, "20");
            return convertToDTO(repository.save(config));
        }
    }

    public ConfigurationDTO setPlafondReouverture(Double valeur) {
        Optional<Configuration> opt = repository.findByCle(CLE_PLAFOND_REOUVERTURE);
        Configuration config;
        if (opt.isPresent()) {
            config = opt.get();
        } else {
            config = new Configuration();
            config.setCle(CLE_PLAFOND_REOUVERTURE);
        }
        config.setValeur(String.valueOf(valeur));
        return convertToDTO(repository.save(config));
    }

    private ConfigurationDTO convertToDTO(Configuration config) {
        return new ConfigurationDTO(config.getId(), config.getCle(), config.getValeur());
    }
}
