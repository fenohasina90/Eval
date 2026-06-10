package com.eval.backend.repository;

import com.eval.backend.entity.KanbanCustomization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KanbanCustomizationRepository extends JpaRepository<KanbanCustomization, Long> {
}
