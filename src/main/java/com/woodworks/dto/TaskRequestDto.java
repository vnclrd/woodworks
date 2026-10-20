package com.woodworks.dto;

import jakarta.validation.constraints.NotBlank;

// 1. Class declaration
public class TaskRequestDto {

    // 2. Private fields
    @NotBlank(message = "Task title cannot be blank")
    private String title;

    private String description;
    private boolean completed;

    // 3. Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
}