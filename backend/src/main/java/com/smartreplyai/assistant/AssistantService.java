package com.smartreplyai.assistant;

import com.smartreplyai.assistant.dto.AssistantChatRequest;
import com.smartreplyai.assistant.dto.AssistantChatResponse;
import com.smartreplyai.assistant.dto.AssistantStatusDto;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AssistantService {

    private final GeminiChatClient geminiChatClient;
    private final TenantAssistantContext tenantAssistantContext;

    public AssistantService(GeminiChatClient geminiChatClient, TenantAssistantContext tenantAssistantContext) {
        this.geminiChatClient = geminiChatClient;
        this.tenantAssistantContext = tenantAssistantContext;
    }

    public AssistantStatusDto status() {
        return new AssistantStatusDto(geminiChatClient.isConfigured(), geminiChatClient.getModel(), "gemini");
    }

    public AssistantChatResponse chat(AssistantChatRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("Select a business workspace first. The assistant answers only for the current business.");
        }
        String prompt = tenantAssistantContext.build(businessId);
        String reply = geminiChatClient.reply(prompt, request.getMessage(), request.getHistory());
        return new AssistantChatResponse(reply, geminiChatClient.getModel());
    }
}
