package com.woodworks.controller;

import com.woodworks.model.DailyTask;
import com.woodworks.model.User;
import com.woodworks.repository.DailyTaskRepository;
import com.woodworks.repository.UserRepository;
import com.woodworks.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/daily-tasks")
@CrossOrigin(origins = {"http://localhost:5173", "https://woodworks-ptms.vercel.app"}, allowCredentials = "true")
public class DailyTaskController {

    private final DailyTaskRepository dailyTaskRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public DailyTaskController(DailyTaskRepository dailyTaskRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.dailyTaskRepository = dailyTaskRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    private Long getUserIdFromToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String email = jwtUtil.getEmailFromJwtToken(token);
            
            // Look up the user ID from the database using the email
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found for token"));
            return user.getId();
        }
        throw new RuntimeException("Unauthorized");
    }

    @GetMapping
    public ResponseEntity<List<DailyTask>> getDailyTasks(@RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        return ResponseEntity.ok(dailyTaskRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<DailyTask> createDailyTask(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody DailyTask taskRequest) {
        Long userId = getUserIdFromToken(authHeader);
        taskRequest.setUserId(userId);
        DailyTask saved = dailyTaskRepository.save(taskRequest);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DailyTask> updateDailyTask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody DailyTask taskRequest) {
        Long userId = getUserIdFromToken(authHeader);
        Optional<DailyTask> existing = dailyTaskRepository.findById(id);

        if (existing.isPresent() && existing.get().getUserId().equals(userId)) {
            DailyTask task = existing.get();
            task.setTitle(taskRequest.getTitle());
            task.setLastCompleted(taskRequest.getLastCompleted());
            return ResponseEntity.ok(dailyTaskRepository.save(task));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDailyTask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        Long userId = getUserIdFromToken(authHeader);
        Optional<DailyTask> existing = dailyTaskRepository.findById(id);

        if (existing.isPresent() && existing.get().getUserId().equals(userId)) {
            dailyTaskRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}