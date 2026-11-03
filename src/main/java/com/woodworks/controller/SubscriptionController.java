package com.woodworks.controller;

import com.woodworks.model.User;
import com.woodworks.repository.UserRepository;
import com.woodworks.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public SubscriptionController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    private String getEmailFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.getEmailFromJwtToken(authHeader.substring(7));
        }
        return null;
    }

    @PostMapping("/upgrade")
    public ResponseEntity<?> upgradeSubscription(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {

        String email = getEmailFromHeader(authHeader);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String plan = request.get("plan"); // Expected: "premium_monthly", "premium_yearly", "lifetime"
        if (plan == null || (!plan.equals("premium_monthly") && !plan.equals("premium_yearly") && !plan.equals("lifetime"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid subscription plan selected."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found."));
        }

        User user = userOpt.get();

        // Map plans to roles
        if (plan.equals("lifetime")) {
            user.setRole("lifetime");
        } else if (plan.equals("premium_monthly") || plan.equals("premium_yearly")) {
            user.setRole("premium");
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "message", "Successfully upgraded to " + plan.replace("_", " ") + "!",
            "role", user.getRole()
        ));
    }
}