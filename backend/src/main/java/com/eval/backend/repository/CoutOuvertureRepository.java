package com.eval.backend.repository;

import com.eval.backend.entity.CoutOuverture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoutOuvertureRepository extends JpaRepository<CoutOuverture, Long> {
    List<CoutOuverture> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
