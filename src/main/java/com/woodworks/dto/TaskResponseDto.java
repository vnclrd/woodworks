package com.woodworks.dto;

// 1. Class declaration
public class TaskResponseDto {

    // 2. Private fields
    private Long id;
    private String title;
    private String description;
    private boolean completed;
    private boolean pinned;
    private boolean urgent;

    // 3. Constructor
    public TaskResponseDto(Long id, String title, String description, boolean completed, boolean pinned, boolean urgent) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.pinned = pinned;
        this.urgent = urgent;
    }

    // 4. Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public boolean isCompleted() { return completed; }
    public boolean isPinned() { return pinned; }
    public boolean isUrgent() { return urgent; }
}