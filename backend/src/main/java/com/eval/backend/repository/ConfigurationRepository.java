package com.eval.backend.repository;

import com.eval.backend.entity.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConfigurationRepository extends JpaRepository<Configuration, Long> {
    Optional<Configuration> findByCle(String cle);
}
