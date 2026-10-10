package com.smartreplyai.ai;

import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;

public interface AiProvider {
    String getProviderName();
    AiGenerationResponse generateReply(AiGenerationRequest request);
}
