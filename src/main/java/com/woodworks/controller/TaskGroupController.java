package com.woodworks.controller;

import com.woodworks.dto.TaskGroupRequestDto;
import com.woodworks.dto.TaskGroupResponseDto;
import com.woodworks.service.TaskGroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class TaskGroupController {

    private final TaskGroupService taskGroupService;

    public TaskGroupController(TaskGroupService taskGroupService) {
        this.taskGroupService = taskGroupService;
    }

    private String getCurrentUserEmail() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<TaskGroupResponseDto> getAllGroups() {
        return taskGroupService.getGroupsByUserEmail(getCurrentUserEmail());
    }

    @PostMapping
    public ResponseEntity<TaskGroupResponseDto> createGroup(@Valid @RequestBody TaskGroupRequestDto requestDto) {
        TaskGroupResponseDto created = taskGroupService.createGroupForUser(requestDto, getCurrentUserEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        taskGroupService.deleteGroupForUser(id, getCurrentUserEmail());
        return ResponseEntity.noContent().build();
    }
}