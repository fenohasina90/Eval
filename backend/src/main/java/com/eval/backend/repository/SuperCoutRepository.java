package com.eval.backend.repository;

import com.eval.backend.entity.SuperCout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuperCoutRepository extends JpaRepository<SuperCout, Long> {
    List<SuperCout> findByTicketId(Long ticketId);
}
