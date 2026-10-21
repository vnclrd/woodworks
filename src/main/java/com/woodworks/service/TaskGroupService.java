package com.woodworks.service;

import com.woodworks.dto.TaskGroupRequestDto;
import com.woodworks.dto.TaskGroupResponseDto;
import com.woodworks.model.Task;
import com.woodworks.model.TaskGroup;
import com.woodworks.model.User;
import com.woodworks.repository.TaskGroupRepository;
import com.woodworks.repository.TaskRepository;
import com.woodworks.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskGroupService {

    private final TaskGroupRepository taskGroupRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public TaskGroupService(TaskGroupRepository taskGroupRepository, UserRepository userRepository, TaskRepository taskRepository) {
        this.taskGroupRepository = taskGroupRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public List<TaskGroupResponseDto> getGroupsByUserEmail(String email) {
        User user = getUserByEmail(email);
        return taskGroupRepository.findByUser(user).stream()
                .map(g -> new TaskGroupResponseDto(g.getId(), g.getName(), g.getColor()))
                .collect(Collectors.toList());
    }

    public TaskGroupResponseDto createGroupForUser(TaskGroupRequestDto requestDto, String email) {
        User user = getUserByEmail(email);
        TaskGroup group = new TaskGroup(requestDto.getName(), requestDto.getColor());
        group.setUser(user);
        
        TaskGroup saved = taskGroupRepository.save(group);
        return new TaskGroupResponseDto(saved.getId(), saved.getName(), saved.getColor());
    }

    public void deleteGroupForUser(Long id, String email) {
        User user = getUserByEmail(email);
        TaskGroup group = taskGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!group.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to group");
        }

        // Unassign tasks from this group so they move to "No group" instead of being deleted
        List<Task> tasksInGroup = taskRepository.findByUserAndGroupName(user, group.getName());
        for (Task task : tasksInGroup) {
            task.setGroupName(null);
            taskRepository.save(task);
        }

        taskGroupRepository.delete(group);
    }
}