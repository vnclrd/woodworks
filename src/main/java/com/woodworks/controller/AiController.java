package com.woodworks.controller;

import com.woodworks.model.User;
import com.woodworks.repository.UserRepository;
import com.woodworks.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final UserRepository userRepository;

    public AiController(AiService aiService, UserRepository userRepository) {
        this.aiService = aiService;
        this.userRepository = userRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> handleChat(Authentication authentication, @RequestBody Map<String, Object> payload) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String userMessage = (String) payload.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be blank"));
        }

        String aiReply = aiService.processUserQuery(user, userMessage);
        return ResponseEntity.ok(Map.of("reply", aiReply));
    }
}