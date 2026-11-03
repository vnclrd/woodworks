package com.woodworks.repository;

import com.woodworks.model.Task;
import com.woodworks.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUser(User user);
    List<Task> findByUserAndGroupName(User user, String groupName);

    // Add this query to fetch tasks and their subtasks together by user email
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.subtasks WHERE t.user.email = :email")
    List<Task> findByUserEmailWithSubtasks(@Param("email") String email);
}