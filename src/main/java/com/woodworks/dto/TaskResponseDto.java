package com.woodworks.dto;

// 1. Class declaration
public class TaskResponseDto {

    // 2. Private fields
    private Long id;
    private String title;
    private String description;
    private boolean completed;

    // 3. Constructor
    public TaskResponseDto(Long id, String title, String description, boolean completed) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.completed = completed;
    }

    // 4. Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public boolean isCompleted() { return completed; }
}