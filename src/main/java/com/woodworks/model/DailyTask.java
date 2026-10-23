package com.woodworks.model;

import com.woodworks.util.EncryptedStringConverter;

import jakarta.persistence.*;

@Entity
@Table(name = "daily_tasks")
public class DailyTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(nullable = false)
    private String title;

    @Column(name = "last_completed")
    private String lastCompleted;

    // Constructors
    public DailyTask() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLastCompleted() {
        return lastCompleted;
    }

    public void setLastCompleted(String lastCompleted) {
        this.lastCompleted = lastCompleted;
    }
}