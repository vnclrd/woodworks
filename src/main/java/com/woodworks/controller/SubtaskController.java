package com.woodworks.controller;

import com.woodworks.model.Subtask;
import com.woodworks.model.Task;
import com.woodworks.model.User;
import com.woodworks.repository.SubtaskRepository;
import com.woodworks.repository.TaskRepository;
import com.woodworks.repository.UserRepository;
import com.woodworks.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subtasks")
public class SubtaskController {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public SubtaskController(SubtaskRepository subtaskRepository, TaskRepository taskRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.subtaskRepository = subtaskRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    private String getEmailFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.getEmailFromJwtToken(authHeader.substring(7));
        }
        return null;
    }

    @PostMapping("/task/{taskId}")
    public ResponseEntity<?> addSubtask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long taskId,
            @RequestBody Map<String, String> request) {

        String email = getEmailFromHeader(authHeader);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && "free".equals(userOpt.get().getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Subtasks require a Premium or Lifetime plan."));
        }

        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Task not found"));

        String title = request.get("title");
        if (title == null || title.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));

        Subtask subtask = new Subtask(title.trim(), taskOpt.get());
        subtaskRepository.save(subtask);

        return ResponseEntity.ok(subtask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubtask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {

        String email = getEmailFromHeader(authHeader);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        Optional<Subtask> subtaskOpt = subtaskRepository.findById(id);
        if (subtaskOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Subtask not found"));
        }

        Subtask subtask = subtaskOpt.get();

        if (request.containsKey("title")) {
            subtask.setTitle((String) request.get("title"));
        }
        if (request.containsKey("completed")) {
            subtask.setCompleted((Boolean) request.get("completed"));
        }

        subtaskRepository.save(subtask);
        return ResponseEntity.ok(subtask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubtask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        String email = getEmailFromHeader(authHeader);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        subtaskRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Subtask deleted"));
    }
}