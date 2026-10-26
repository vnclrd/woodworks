package com.woodworks.controller;

import com.woodworks.model.User;
import com.woodworks.repository.UserRepository;
import com.woodworks.security.JwtUtil;
import com.woodworks.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, EmailService emailService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use"));
        }

        User user = new User(email, passwordEncoder.encode(password));
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setEnabled(false);
        userRepository.save(user);

        // 1. Send verification email to the new user
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl == null || frontendUrl.isEmpty()) {
            // frontendUrl = "https://woodworks-ptms.vercel.app";
            frontendUrl = "http://localhost:5173";
        }
        // Clean trailing slashes to prevent "//verify-email"
        frontendUrl = frontendUrl.replaceAll("/+$", "");
        String verifyUrl = frontendUrl + "/verify-email?token=" + verificationToken;

        String userEmailBody = "Welcome to WoodWorks!\n\n"
                + "Thank you for creating an account. Please verify your email address by clicking the link below:\n\n"
                + verifyUrl + "\n\n"
                + "Best regards,\n"
                + "The WoodWorks Team";

        emailService.sendEmail(email, "Verify your WoodWorks Account", userEmailBody);

        // 2. Send notification alert to admin email addresses
        String adminEmail1 = System.getenv("ADMIN_NOTIFICATION_EMAIL_1");
        String adminEmail2 = System.getenv("ADMIN_NOTIFICATION_EMAIL_2");

        List<String> recipients = new ArrayList<>();
        if (adminEmail1 != null && !adminEmail1.isBlank()) recipients.add(adminEmail1.trim());
        if (adminEmail2 != null && !adminEmail2.isBlank()) recipients.add(adminEmail2.trim());

        if (!recipients.isEmpty()) {
            String adminEmailBody = "New WoodWorks User Registration!\n\n"
                    + "A new user just signed up:\n"
                    + "- Email: " + email + "\n"
                    + "- Timestamp: " + java.time.LocalDateTime.now() + "\n\n"
                    + "The account is currently pending email verification.";

            for (String recipient : recipients) {
                emailService.sendEmail(recipient, "🔔 New User Alert: " + email, adminEmailBody);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Registration successful. Please check your email to verify your account."));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        Optional<User> userOpt = userRepository.findByVerificationToken(token);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired verification token"));
        }

        User user = userOpt.get();
        user.setEnabled(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Email verified successfully! You can now log in."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        User user = userOpt.get();
        if (!user.isEnabled()) {
            return ResponseEntity.status(403).body(Map.of("error", "Please verify your email address before logging in"));
        }

        String token = jwtUtil.generateToken(email);
        return ResponseEntity.ok(Map.of(
            "token", token, 
            "email", email, 
            "avatar", user.getAvatar() != null ? user.getAvatar() : ""
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String resetToken = UUID.randomUUID().toString();
            
            user.setResetPasswordToken(resetToken);
            // Set token to expire in 15 minutes
            user.setResetPasswordExpiresAt(java.time.LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            String frontendUrl = System.getenv("FRONTEND_URL");
            if (frontendUrl == null || frontendUrl.isEmpty()) {
                frontendUrl = "https://woodworks-ptms.vercel.app";
            }
            frontendUrl = frontendUrl.replaceAll("/+$", "");
            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;

            String body = "Hello,\n\n"
                    + "You requested a password reset for your WoodWorks account. Click the link below to set a new password:\n\n"
                    + resetUrl + "\n\n"
                    + "This link will expire in 15 minutes.\n\n"
                    + "If you didn't request this, you can safely ignore this email.\n\n"
                    + "Best regards,\n"
                    + "The WoodWorks Team";

            emailService.sendEmail(user.getEmail(), "Reset your WoodWorks Password", body);
        }

        return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid request."));
        }

        Optional<User> userOpt = userRepository.findByResetPasswordToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired password reset token."));
        }

        User user = userOpt.get();

        // Check if the token has expired
        if (user.getResetPasswordExpiresAt() == null || user.getResetPasswordExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password reset token has expired. Please request a new one."));
        }

        // Check if the new password is the same as the old password
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password cannot be the same as your current password."));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiresAt(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password successfully reset. You can now sign in with your new password."));
    }

    @PostMapping("/update-avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        // Remove 'avatar == null' check so users can switch back to the default avatar (null)
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found."));
        }

        User user = userOpt.get();
        String avatar = request.get("avatar");
        user.setAvatar(avatar); 
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "message", "Avatar updated successfully", 
            "avatar", avatar != null ? avatar : ""
        ));
    }
}