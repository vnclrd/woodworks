package com.woodworks.service;

import com.woodworks.dto.TaskRequestDto;
import com.woodworks.dto.TaskResponseDto;
import com.woodworks.model.Task;
import com.woodworks.model.User;
import com.woodworks.repository.TaskRepository;
import com.woodworks.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public List<TaskResponseDto> getTasksByUserEmail(String email) {
        User user = getUserByEmail(email);
        return taskRepository.findByUser(user).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public TaskResponseDto getTaskByIdAndUserEmail(Long id, String email) {
        User user = getUserByEmail(email);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to task");
        }

        return mapToResponseDto(task);
    }

    public TaskResponseDto createTaskForUser(TaskRequestDto requestDto, String email) {
        User user = getUserByEmail(email);
        Task task = new Task(requestDto.getTitle(), requestDto.getDescription(), requestDto.isCompleted());
        task.setUser(user);
        
        task.setPinned(requestDto.isPinned());
        task.setUrgent(requestDto.isUrgent());

        task.setGroupName(requestDto.getGroupName());
        
        if (requestDto.isCompleted()) {
            task.setCompletedAt(LocalDateTime.now());
        }
        
        Task savedTask = taskRepository.save(task);
        return mapToResponseDto(savedTask);
    }

    public TaskResponseDto updateTaskForUser(Long id, TaskRequestDto requestDto, String email) {
        User user = getUserByEmail(email);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to task");
        }

        task.setTitle(requestDto.getTitle());
        task.setDescription(requestDto.getDescription());
        
        task.setPinned(requestDto.isPinned());
        task.setUrgent(requestDto.isUrgent());

        task.setGroupName(requestDto.getGroupName());
        
        if (requestDto.isCompleted() && !task.isCompleted()) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (!requestDto.isCompleted()) {
            task.setCompletedAt(null);
        }
        task.setCompleted(requestDto.isCompleted());

        Task updatedTask = taskRepository.save(task);
        return mapToResponseDto(updatedTask);
    }

    public void deleteTaskForUser(Long id, String email) {
        User user = getUserByEmail(email);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to task");
        }

        taskRepository.delete(task);
    }

    private TaskResponseDto mapToResponseDto(Task task) {
        return new TaskResponseDto(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isCompleted(),
                task.isPinned(),
                task.isUrgent(),
                task.getGroupName()
        );
    }
}