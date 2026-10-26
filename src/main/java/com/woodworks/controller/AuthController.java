package com.woodworks.controller;

import com.woodworks.model.User;
import com.woodworks.repository.UserRepository;
import com.woodworks.security.JwtUtil;
import com.woodworks.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
            frontendUrl = "https://woodworks-ptms.vercel.app";
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
        return ResponseEntity.ok(Map.of("token", token, "email", email));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);

        // For security reasons, don't reveal if email exists or not
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30)); // 30 min expiry
            userRepository.save(user);

            String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;
            emailService.sendEmail(email, "Reset your WoodWorks Password", 
                "Click the link below to reset your password. This link expires in 30 minutes:\n" + resetUrl);
        }

        return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters long"));
        }

        Optional<User> userOpt = userRepository.findAll().stream()
                .filter(u -> token.equals(u.getResetToken()) && u.getResetTokenExpiry() != null && u.getResetTokenExpiry().isAfter(LocalDateTime.now()))
                .findFirst();

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired password reset token"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password has been successfully reset. You can now log in."));
    }
}