package com.smartreplyai.conversation.dto;

import jakarta.validation.constraints.NotBlank;

public class SendMessageRequest {

    @NotBlank(message = "Message text cannot be blank")
    private String textContent;

    public SendMessageRequest() {
    }

    public SendMessageRequest(String textContent) {
        this.textContent = textContent;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }
}
