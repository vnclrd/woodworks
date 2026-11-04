package com.woodworks.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "focus_sessions")
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate sessionDate;

    @Column(nullable = false)
    private int durationMinutes; // e.g., 25 mins per Pomodoro

    // Constructors, Getters, and Setters
    public FocusSession() {}

    public FocusSession(User user, LocalDate sessionDate, int durationMinutes) {
        this.user = user;
        this.sessionDate = sessionDate;
        this.durationMinutes = durationMinutes;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
}