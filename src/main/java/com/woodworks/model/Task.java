package com.woodworks.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "tasks")
// 1. Class declaration
public class Task {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  // 2. Private fields
  private Long id;

  @NotBlank(message = "Task title cannot be blank")
  private String title;
  private String description;
  private boolean completed;

  // 3. Default constructor (Required by JPA)
  public Task() {}

  // 3.1 Constructor
  public Task(String title, String description, boolean completed) {
    this.title = title;
    this.description = description;
    this.completed = completed;
  }

  // 4. Getters and Setters
  public long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public boolean isCompleted() {
    return completed;
  }

  public void setCompleted(boolean completed) {
    this.completed = completed;
  }
}
