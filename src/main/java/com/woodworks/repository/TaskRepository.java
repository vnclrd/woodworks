package com.woodworks.repository;

import com.woodworks.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    // Spring Data JPA automatically provides built-in CRUD operations here.
    // You can also add custom query methods later if needed (e.g., findByCompleted(boolean completed))
}