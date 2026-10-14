package com.smartreplyai.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class AssistantChatRequest {

    @NotBlank
    @Size(max = 4000)
    private String message;

    @Size(max = 12)
    private List<AssistantTurn> history = new ArrayList<>();

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<AssistantTurn> getHistory() {
        return history;
    }

    public void setHistory(List<AssistantTurn> history) {
        this.history = history;
    }
}
