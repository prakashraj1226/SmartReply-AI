package com.smartreplyai.assistant;

import com.smartreplyai.assistant.dto.AssistantChatRequest;
import com.smartreplyai.assistant.dto.AssistantChatResponse;
import com.smartreplyai.assistant.dto.AssistantStatusDto;
import com.smartreplyai.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<AssistantStatusDto>> status() {
        return ResponseEntity.ok(ApiResponse.ok(assistantService.status()));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AssistantChatResponse>> chat(@Valid @RequestBody AssistantChatRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(assistantService.chat(request)));
    }
}
