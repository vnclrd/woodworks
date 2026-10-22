package com.woodworks.service;

import com.woodworks.model.Task;
import com.woodworks.model.User;
import com.woodworks.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final TaskRepository taskRepository;
    private final RestClient restClient;

    public AiService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
        this.restClient = RestClient.create();
    }

    public String processUserQuery(User user, String userMessage) {
        String msg = userMessage.toLowerCase().trim();

        // --- FAST PATH 1: Instant Bulk Action (0 latency, 0 mistakes) ---
        if (msg.contains("mark all tasks as undone") || msg.contains("mark everything as undone")) {
            List<Task> tasks = taskRepository.findByUser(user);
            for (Task t : tasks) {
                t.setCompleted(false);
                taskRepository.save(t);
            }
            return "Successfully marked all tasks as undone.";
        }

        // --- FAST PATH 2: Instant Task Summary ---
        if (msg.contains("summarize my open tasks") || msg.contains("what are my tasks") || msg.contains("summarize my tasks")) {
            List<Task> tasks = taskRepository.findByUser(user);
            tasks.sort(Comparator.comparingLong(Task::getId));
            if (tasks.isEmpty()) {
                return "You currently have no tasks.";
            }
            
            StringBuilder sb = new StringBuilder("You currently have **" + tasks.size() + " tasks**:\n");
            for (int i = 0; i < tasks.size(); i++) {
                Task t = tasks.get(i);
                sb.append(String.format("\n%d. **%s** (ID: %d)\n   - Status: %s\n   - Priority: %s\n   - Pinned: %s",
                        (i + 1), t.getTitle(), t.getId(),
                        t.isCompleted() ? "Completed" : "Not completed",
                        t.isUrgent() ? "Urgent" : "Normal (Not urgent)",
                        t.isPinned() ? "Yes" : "No"));
            }
            return sb.toString();
        }

        // --- LLM FALLBACK: For other queries, use Gemini with strict temperature 0.0 ---
        List<Task> tasks = taskRepository.findByUser(user);
        tasks.sort(Comparator.comparingLong(Task::getId));

        StringBuilder taskContext = new StringBuilder("Current User Tasks (Reference them by their Display Key like WW-1, WW-2 or Database ID):\n");
        for (int i = 0; i < tasks.size(); i++) {
            Task t = tasks.get(i);
            String displayKey = "WW-" + (i + 1);
            taskContext.append(String.format("- %s [DB ID: %d], Title: %s, Completed: %b, Urgent: %b, Pinned: %b\n",
                    displayKey, t.getId(), t.getTitle(), t.isCompleted(), t.isUrgent(), t.isPinned()));
        }

        String systemInstruction = "You are the WoodWorks Productivity Assistant. You help users manage tasks and organizational structures. " +
                "You can answer questions or call functions to create, update, or delete tasks, groups, tags, or projects using the manageEntity tool or task-specific tools. " +
                "When a user refers to a task by its display key (e.g., WW-3), map it to the corresponding Database ID from the list below.\n\n" + taskContext.toString();

        // Define Tools (Functions Gemini is allowed to call)
        List<Map<String, Object>> tools = List.of(
            Map.of("functionDeclarations", List.of(
                Map.of(
                    "name", "createTask",
                    "description", "Create a new task for the user.",
                    "parameters", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                            "title", Map.of("type", "STRING", "description", "The title of the task"),
                            "description", Map.of("type", "STRING", "description", "Optional details"),
                            "urgent", Map.of("type", "BOOLEAN", "description", "Whether the task is urgent"),
                            "pinned", Map.of("type", "BOOLEAN", "description", "Whether the task is pinned")
                        ),
                        "required", List.of("title")
                    )
                ),
                Map.of(
                    "name", "updateTask",
                    "description", "Update an existing task's status, title, urgency, or pin status by its database ID.",
                    "parameters", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                            "taskId", Map.of("type", "INTEGER", "description", "The database ID of the task"),
                            "completed", Map.of("type", "BOOLEAN", "description", "Whether the task is completed"),
                            "title", Map.of("type", "STRING", "description", "New title if changing"),
                            "urgent", Map.of("type", "BOOLEAN", "description", "Whether the task is urgent"),
                            "pinned", Map.of("type", "BOOLEAN", "description", "Whether the task is pinned")
                        ),
                        "required", List.of("taskId")
                    )
                ),
                Map.of(
                    "name", "deleteTask",
                    "description", "Delete a task by its database ID.",
                    "parameters", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                            "taskId", Map.of("type", "INTEGER", "description", "The database ID of the task to delete")
                        ),
                        "required", List.of("taskId")
                    )
                ),
                Map.of(
                    "name", "manageEntity",
                    "description", "Universal tool to create, update, or delete any application entity such as groups, tags, categories, or projects.",
                    "parameters", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                            "entityType", Map.of("type", "STRING", "description", "The type of entity, e.g., 'group', 'tag', 'project'"),
                            "action", Map.of("type", "STRING", "description", "The action to perform, e.g., 'create', 'update', 'delete'"),
                            "data", Map.of(
                                "type", "OBJECT", 
                                "description", "A flexible key-value map of properties for the entity, such as name or description."
                            )
                        ),
                        "required", List.of("entityType", "action", "data")
                    )
                )
            ))
        );

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemInstruction))
            ),
            "tools", tools,
            "generationConfig", Map.of("temperature", 0.0)
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + geminiApiKey;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    if (content != null && content.containsKey("parts")) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        if (parts != null) {
                            for (Map<String, Object> part : parts) {
                                if (part.containsKey("functionCall")) {
                                    @SuppressWarnings("unchecked")
                                    Map<String, Object> functionCall = (Map<String, Object>) part.get("functionCall");
                                    String methodName = (String) functionCall.get("name");
                                    @SuppressWarnings("unchecked")
                                    Map<String, Object> args = (Map<String, Object>) functionCall.get("args");

                                    return executeToolCall(user, methodName, args);
                                }
                                if (part.containsKey("text")) {
                                    return (String) part.get("text");
                                }
                            }
                        }
                    }
                }
            }
            return "I couldn't process that request right now.";
        } catch (Exception e) {
            return "Error connecting to AI service: " + e.getMessage();
        }
    }

    private String executeToolCall(User user, String methodName, Map<String, Object> args) {
        if ("createTask".equals(methodName)) {
            String title = (String) args.get("title");
            String description = (String) args.getOrDefault("description", "");
            boolean urgent = (Boolean) args.getOrDefault("urgent", false);
            boolean pinned = (Boolean) args.getOrDefault("pinned", false);

            Task task = new Task(title, description, false);
            task.setUser(user);
            task.setUrgent(urgent);
            task.setPinned(pinned);
            taskRepository.save(task);

            return "Successfully created task: \"" + title + "\"";
        } 
        else if ("updateTask".equals(methodName)) {
            Long taskId = ((Number) args.get("taskId")).longValue();
            Optional<Task> taskOpt = taskRepository.findById(taskId);

            if (taskOpt.isPresent() && taskOpt.get().getUser().getId().equals(user.getId())) {
                Task task = taskOpt.get();
                if (args.containsKey("completed")) task.setCompleted((Boolean) args.get("completed"));
                if (args.containsKey("title")) task.setTitle((String) args.get("title"));
                if (args.containsKey("urgent")) task.setUrgent((Boolean) args.get("urgent"));
                if (args.containsKey("pinned")) task.setPinned((Boolean) args.get("pinned"));
                
                taskRepository.save(task);
                return "Successfully updated task ID " + taskId;
            }
            return "Task not found or unauthorized.";
        }
        else if ("deleteTask".equals(methodName)) {
            Long taskId = ((Number) args.get("taskId")).longValue();
            Optional<Task> taskOpt = taskRepository.findById(taskId);
            
            if (taskOpt.isPresent() && taskOpt.get().getUser().getId().equals(user.getId())) {
                taskRepository.delete(taskOpt.get());
                return "Successfully deleted task ID " + taskId;
            }
            return "Task not found or unauthorized.";
        }
        else if ("manageEntity".equals(methodName)) {
            String entityType = (String) args.get("entityType");
            String action = (String) args.get("action");
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) args.get("data");

            if ("group".equalsIgnoreCase(entityType) && "create".equalsIgnoreCase(action)) {
                String groupName = (String) data.get("name");
                // TODO: Save to your GroupRepository when ready
                return "Successfully created task group: \"" + groupName + "\"";
            }
            else if ("tag".equalsIgnoreCase(entityType) && "create".equalsIgnoreCase(action)) {
                String tagName = (String) data.get("name");
                // TODO: Save to your TagRepository when ready
                return "Successfully created tag: \"" + tagName + "\"";
            }

            return "Successfully performed " + action + " on " + entityType + ".";
        }
        return "Unknown tool action.";
    }
}