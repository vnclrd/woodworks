package com.woodworks.service;

import com.woodworks.model.Task;
import com.woodworks.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
// 1. Class declaration
public class TaskService {

    // 2. Private fields
    private final TaskRepository taskRepository;

    // 3. Constructor
    // Constructor-based Dependency Injection (Spring automatically injects TaskRepository)
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // 4. Behavioral Methods
    // Get all tasks
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    // Get a task by ID
    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    // Create a new task
    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    // Update an existing task
    public Task updateTask(Long id, Task taskDetails) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setCompleted(taskDetails.isCompleted());

        return taskRepository.save(task);
    }

    // Delete a task
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}