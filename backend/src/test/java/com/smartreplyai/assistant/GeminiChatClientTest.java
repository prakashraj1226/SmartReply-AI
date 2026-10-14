package com.smartreplyai.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.common.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GeminiChatClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractReplyText_joinsTextParts() throws Exception {
        String json = """
                {"candidates":[{"content":{"parts":[{"text":"My name is SmartReply AI."},{"text":"How can I help?"}]}}]}
                """;

        String reply = GeminiChatClient.extractReplyText(objectMapper.readTree(json));

        assertEquals("My name is SmartReply AI.\nHow can I help?", reply);
    }

    @Test
    void extractReplyText_whenBlocked_throws() throws Exception {
        String json = """
                {"promptFeedback":{"blockReason":"SAFETY"}}
                """;

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> GeminiChatClient.extractReplyText(objectMapper.readTree(json)));

        assertEquals("Gemini blocked that reply (SAFETY). Try a different question.", ex.getMessage());
    }
}
