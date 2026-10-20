package com.woodworks.service;

import com.woodworks.dto.TaskRequestDto;
import com.woodworks.dto.TaskResponseDto;
import com.woodworks.model.Task;
import com.woodworks.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
// 1. Class declaration
public class TaskService {

    // 2. Private fields
    private final TaskRepository taskRepository;
    
    // 3. Constructors
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // 4. Behavioral Methods
    // Get all tasks mapped to Response DTOs
    public List<TaskResponseDto> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // Get a single task mapped to a Response DTO
    public TaskResponseDto getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        return mapToResponseDto(task);
    }

    // Create a new task from Request DTO
    public TaskResponseDto createTask(TaskRequestDto requestDto) {
        Task task = new Task(requestDto.getTitle(), requestDto.getDescription(), requestDto.isCompleted());
        Task savedTask = taskRepository.save(task);
        return mapToResponseDto(savedTask);
    }

    // Update an existing task using Request DTO
    public TaskResponseDto updateTask(Long id, TaskRequestDto requestDto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        task.setTitle(requestDto.getTitle());
        task.setDescription(requestDto.getDescription());
        task.setCompleted(requestDto.isCompleted());

        Task updatedTask = taskRepository.save(task);
        return mapToResponseDto(updatedTask);
    }

    // Delete a task
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    // Helper mapper method
    private TaskResponseDto mapToResponseDto(Task task) {
        return new TaskResponseDto(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isCompleted()
        );
    }
}