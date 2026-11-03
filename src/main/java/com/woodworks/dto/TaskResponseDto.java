package com.woodworks.dto;

import com.woodworks.model.Subtask;
import java.util.List;
import java.util.ArrayList;

public class TaskResponseDto {

    private Long id;
    private String title;
    private String description;
    private boolean completed;
    private boolean pinned;
    private boolean urgent;
    private String groupName;
    private List<Subtask> subtasks = new ArrayList<>(); // <-- Add subtasks field

    public TaskResponseDto(Long id, String title, String description, boolean completed, boolean pinned, boolean urgent, String groupName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.pinned = pinned;
        this.urgent = urgent;
        this.groupName = groupName;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public boolean isCompleted() { return completed; }
    public boolean isPinned() { return pinned; }
    public boolean isUrgent() { return urgent; }
    public String getGroupName() { return groupName; }
    public List<Subtask> getSubtasks() { return subtasks; }

    // Setters
    public void setSubtasks(List<Subtask> subtasks) { this.subtasks = subtasks; }
}