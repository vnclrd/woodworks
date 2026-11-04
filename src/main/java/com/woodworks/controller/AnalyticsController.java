package com.woodworks.controller;

import com.woodworks.model.FocusSession;
import com.woodworks.model.User;
import com.woodworks.repository.FocusSessionRepository;
import com.woodworks.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final FocusSessionRepository focusSessionRepository;
    private final UserRepository userRepository;

    public AnalyticsController(FocusSessionRepository focusSessionRepository, UserRepository userRepository) {
        this.focusSessionRepository = focusSessionRepository;
        this.userRepository = userRepository;
    }

    private String getCurrentUserEmail() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/weekly")
    public ResponseEntity<?> getWeeklyAnalytics() {
        String email = getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Role Gating Check on Backend
        String role = user.getRole() != null ? user.getRole() : "free";
        if (role.equals("free")) {
            return ResponseEntity.status(403).body(Map.of("error", "Analytics are a Premium feature"));
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);

        List<FocusSession> sessions = focusSessionRepository.findByUserAndSessionDateBetween(user, startDate, endDate);

        // Group sessions by date
        Map<String, Long> dailyCounts = sessions.stream()
                .collect(Collectors.groupingBy(
                        session -> session.getSessionDate().toString(),
                        Collectors.counting()
                ));

        return ResponseEntity.ok(Map.of(
                "startDate", startDate.toString(),
                "endDate", endDate.toString(),
                "dailySessions", dailyCounts
        ));
    }

    @PostMapping("/session")
    public ResponseEntity<?> logFocusSession(@RequestBody Map<String, Integer> request) {
        String email = getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int duration = request.getOrDefault("durationMinutes", 25);
        FocusSession session = new FocusSession(user, LocalDate.now(), duration);
        focusSessionRepository.save(session);

        return ResponseEntity.ok(Map.of("message", "Focus session logged successfully"));
    }
}