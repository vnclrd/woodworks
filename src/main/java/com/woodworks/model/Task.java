package com.woodworks.model;

import java.time.LocalDateTime;

import com.woodworks.util.EncryptedStringConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity // Tells Spring Boot that this class represents a table in the database
@Table(name = "tasks") // Tells Spring Boot exactly which database table this class should map to
// 1. Class declaration
public class Task {

  @Id // Marks a specific field in this Java class as the primary key of the database table
  @GeneratedValue(strategy = GenerationType.IDENTITY) // Tells Spring Boot how to generate new values the primary key
  // 2. Private fields
  private Long id;

  @NotBlank(message = "Task title cannot be blank") // Annotated element must not be blank
  @Size(max = 100, message = "Task title cannot exceed 100 characters")
  @Convert(converter = EncryptedStringConverter.class)
  @Column(nullable = false, columnDefinition = "TEXT")
  private String title;

  @Size(max = 1000, message = "Task description cannot exceed 1000 characters")
  @Convert(converter = EncryptedStringConverter.class)
  @Column(columnDefinition = "TEXT")
  private String description;
  
  private boolean completed;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  private LocalDateTime completedAt;

  private boolean pinned;
  private boolean urgent;

  @Convert(converter = EncryptedStringConverter.class)
  @Column(columnDefinition = "TEXT")
  private String groupName;

  // 3. Default constructor (Required by JPA)
  public Task() {}

  // 3.1 Constructor
  public Task(String title, String description, boolean completed) {
    this.title = title;
    this.description = description;
    this.completed = completed;
  }

  // 4. Getters and Setters
  public long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public boolean isCompleted() { return completed; }
  public void setCompleted(boolean completed) { this.completed = completed; }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }

  public LocalDateTime getCompletedAt() { return completedAt; }
  public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

  public boolean isPinned() { return pinned; }
  public void setPinned(boolean pinned) { this.pinned = pinned; }

  public boolean isUrgent() { return urgent; }
  public void setUrgent(boolean urgent) { this.urgent = urgent; }

  public String getGroupName() { return groupName; }
  public void setGroupName(String groupName) { this.groupName = groupName; }
}
