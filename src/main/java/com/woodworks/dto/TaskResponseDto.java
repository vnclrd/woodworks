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
    private String groupName;

    // 3. Constructor
    public TaskResponseDto(Long id, String title, String description, boolean completed, boolean pinned, boolean urgent, String groupName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.pinned = pinned;
        this.urgent = urgent;
        this.groupName = groupName;
    }

    // 4. Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public boolean isCompleted() { return completed; }
    public boolean isPinned() { return pinned; }
    public boolean isUrgent() { return urgent; }
    public String getGroupName() { return groupName; }
}