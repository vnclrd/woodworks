package com.woodworks.repository;

import com.woodworks.model.DailyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DailyTaskRepository extends JpaRepository<DailyTask, Long> {
    List<DailyTask> findByUserId(Long userId);
}