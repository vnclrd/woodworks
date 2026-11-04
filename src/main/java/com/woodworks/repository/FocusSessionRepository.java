package com.woodworks.repository;

import com.woodworks.model.FocusSession;
import com.woodworks.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    List<FocusSession> findByUserAndSessionDateBetween(User user, LocalDate startDate, LocalDate endDate);
}