package com.smartreplyai.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartreplyai.assistant.dto.AssistantTurn;
import com.smartreplyai.common.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

@Component
public class GeminiChatClient {

    private static final Logger logger = LoggerFactory.getLogger(GeminiChatClient.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiChatClient(ObjectMapper objectMapper,
                            @Value("${app.gemini.api-key:}") String apiKey,
                            @Value("${app.gemini.model:gemini-1.5-flash}") String model,
                            @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = (model == null || model.isBlank()) ? "gemini-1.5-flash" : model.trim();
        this.baseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/$", "");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    public String reply(String systemPrompt, String message, List<AssistantTurn> history) {
        if (!isConfigured()) {
            throw new BadRequestException("Gemini API key is missing. Set GEMINI_API_KEY and restart the backend.");
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.set("system_instruction", objectMapper.createObjectNode()
                    .set("parts", textParts(systemPrompt)));
            body.set("contents", contents(history, message));
            ObjectNode generation = body.putObject("generationConfig");
            generation.put("temperature", 0.4);
            generation.put("maxOutputTokens", 400);

            String url = baseUrl + "/models/" + model + ":generateContent";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = response.body() == null || response.body().isBlank()
                    ? objectMapper.createObjectNode()
                    : objectMapper.readTree(response.body());

            if (response.statusCode() == 429) {
                throw new BadRequestException("Gemini free daily limit is used up. Try again after 12:30 PM IST, or wait until the quota resets.");
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String detail = root.path("error").path("message").asText("Gemini request failed");
                logger.warn("Gemini HTTP {}: {}", response.statusCode(), detail);
                throw new BadRequestException(detail);
            }
            return extractReplyText(root);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            logger.error("Gemini call failed", ex);
            throw new BadRequestException("Could not reach Gemini. Check the internet connection and try again.");
        }
    }

    static String extractReplyText(JsonNode root) {
        JsonNode error = root.path("error");
        if (error.isObject() && !error.path("message").asText("").isBlank()) {
            throw new BadRequestException(error.path("message").asText());
        }

        StringBuilder reply = new StringBuilder();
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (parts.isArray()) {
            for (JsonNode part : parts) {
                String text = part.path("text").asText("");
                if (text.isBlank()) {
                    continue;
                }
                if (reply.length() > 0) {
                    reply.append('\n');
                }
                reply.append(text.trim());
            }
        }
        if (reply.length() > 0) {
            return reply.toString();
        }

        String blockReason = root.path("promptFeedback").path("blockReason").asText("");
        if (!blockReason.isBlank()) {
            throw new BadRequestException("Gemini blocked that reply (" + blockReason + "). Try a different question.");
        }
        throw new BadRequestException("Gemini did not return a reply.");
    }

    private ArrayNode contents(List<AssistantTurn> history, String message) {
        ArrayNode contents = objectMapper.createArrayNode();
        if (history != null) {
            int start = Math.max(0, history.size() - 8);
            for (int i = start; i < history.size(); i++) {
                AssistantTurn turn = history.get(i);
                if (turn == null || turn.getText() == null || turn.getText().isBlank()) {
                    continue;
                }
                String role = "assistant".equalsIgnoreCase(turn.getRole()) ? "model" : "user";
                contents.add(contentNode(role, turn.getText().trim()));
            }
        }
        contents.add(contentNode("user", message.trim()));
        return contents;
    }

    private ObjectNode contentNode(String role, String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("role", role);
        node.set("parts", textParts(text));
        return node;
    }

    private ArrayNode textParts(String text) {
        ArrayNode parts = objectMapper.createArrayNode();
        parts.addObject().put("text", text);
        return parts;
    }
}
