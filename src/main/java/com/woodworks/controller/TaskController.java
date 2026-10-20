package com.woodworks.controller;

import com.woodworks.dto.TaskRequestDto;
import com.woodworks.dto.TaskResponseDto;
import com.woodworks.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // Helper method to get current logged-in user's email from JWT filter
    private String getCurrentUserEmail() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<TaskResponseDto> getAllTasks() {
        String email = getCurrentUserEmail();
        return taskService.getTasksByUserEmail(email);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDto> getTaskById(@PathVariable Long id) {
        String email = getCurrentUserEmail();
        TaskResponseDto task = taskService.getTaskByIdAndUserEmail(id, email);
        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<TaskResponseDto> createTask(@Valid @RequestBody TaskRequestDto requestDto) {
        String email = getCurrentUserEmail();
        TaskResponseDto createdTask = taskService.createTaskForUser(requestDto, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDto> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequestDto requestDto) {
        String email = getCurrentUserEmail();
        TaskResponseDto updatedTask = taskService.updateTaskForUser(id, requestDto, email);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        String email = getCurrentUserEmail();
        taskService.deleteTaskForUser(id, email);
        return ResponseEntity.noContent().build();
    }
}