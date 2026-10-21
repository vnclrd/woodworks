package com.woodworks.dto;

import jakarta.validation.constraints.NotBlank;

public class TaskGroupRequestDto {
    @NotBlank(message = "Group name cannot be blank")
    private String name;
    private String color;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}