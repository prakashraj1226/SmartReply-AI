package com.smartreplyai.telegram.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.whatsapp.IntegrationAccount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class TelegramBotApiClient implements TelegramClient {

    private static final Logger logger = LoggerFactory.getLogger(TelegramBotApiClient.class);
    private static final String TELEGRAM_API_BASE = "https://api.telegram.org/bot";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public TelegramBotApiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public TelegramSendResult sendMessage(IntegrationAccount account, String chatId, String textContent) {
        if (account == null || account.isSandbox() || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            logger.info("Telegram outbound message simulated for chat {}: {}", chatId, textContent);
            return new TelegramSendResult(true, "simulated_tg_" + System.currentTimeMillis(), true, null);
        }

        try {
            String token = account.getAccessToken().trim();
            String url = TELEGRAM_API_BASE + token + "/sendMessage";

            Map<String, Object> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", textContent);

            String requestJson = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.path("ok").asBoolean(false)) {
                    String messageId = String.valueOf(root.path("result").path("message_id").asLong());
                    logger.info("Dispatched Telegram outbound message to {}: id={}", chatId, messageId);
                    return new TelegramSendResult(true, messageId, false, null);
                }
            }

            JsonNode errorRoot = objectMapper.readTree(response.body());
            String desc = errorRoot.path("description").asText("Telegram API error " + response.statusCode());
            logger.warn("Telegram sendMessage failed: status={} desc={}", response.statusCode(), desc);
            return new TelegramSendResult(false, null, false, desc);
        } catch (Exception e) {
            logger.error("Failed to call Telegram sendMessage for chat " + chatId, e);
            return new TelegramSendResult(false, null, false, e.getMessage());
        }
    }

    @Override
    public TelegramBotInfo getMe(String botToken) {
        if (botToken == null || botToken.isBlank()) {
            return new TelegramBotInfo(false, null, null, null, "Bot token cannot be empty");
        }

        try {
            String url = TELEGRAM_API_BASE + botToken.trim() + "/getMe";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() == 200 && root.path("ok").asBoolean(false)) {
                JsonNode result = root.path("result");
                String username = result.path("username").asText(null);
                String firstName = result.path("first_name").asText("");
                Long id = result.path("id").asLong();
                return new TelegramBotInfo(true, username, firstName, id, null);
            }

            String desc = root.path("description").asText("Invalid bot token (HTTP " + response.statusCode() + ")");
            return new TelegramBotInfo(false, null, null, null, desc);
        } catch (Exception e) {
            logger.error("Failed to verify Telegram bot token", e);
            return new TelegramBotInfo(false, null, null, null, e.getMessage());
        }
    }

    @Override
    public boolean verifyCredentials(IntegrationAccount account) {
        if (account == null || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            return false;
        }
        return getMe(account.getAccessToken()).isValid();
    }

    @Override
    public boolean setWebhook(String botToken, String webhookUrl, String secretToken) {
        if (botToken == null || botToken.isBlank()) {
            return false;
        }
        if (webhookUrl == null || !webhookUrl.startsWith("https://")) {
            logger.info("Telegram setWebhook skipped: Webhook URL must be public HTTPS for real updates (url: {})", webhookUrl);
            return false;
        }

        try {
            String url = TELEGRAM_API_BASE + botToken.trim() + "/setWebhook";
            Map<String, String> body = new HashMap<>();
            body.put("url", webhookUrl);
            if (secretToken != null && !secretToken.isBlank()) {
                body.put("secret_token", secretToken.trim());
            }

            String requestJson = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            boolean ok = response.statusCode() == 200 && root.path("ok").asBoolean(false);
            if (ok) {
                logger.info("Telegram setWebhook registered successfully: {}", webhookUrl);
            } else {
                logger.warn("Telegram setWebhook failed: {}", root.path("description").asText());
            }
            return ok;
        } catch (Exception e) {
            logger.error("Failed to set Telegram webhook", e);
            return false;
        }
    }

    @Override
    public boolean setMyCommands(String botToken) {
        if (botToken == null || botToken.isBlank()) {
            return false;
        }
        try {
            String url = TELEGRAM_API_BASE + botToken.trim() + "/setMyCommands";
            Map<String, Object> body = Map.of(
                    "commands", java.util.List.of(
                            Map.of("command", "start", "description", "Welcome & business overview"),
                            Map.of("command", "services", "description", "View treatments & pricing"),
                            Map.of("command", "hours", "description", "Operating hours & timings"),
                            Map.of("command", "book", "description", "Book an appointment"),
                            Map.of("command", "help", "description", "AI Assistant support")
                    )
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            boolean ok = response.statusCode() == 200 && root.path("ok").asBoolean(false);
            if (ok) {
                logger.info("Telegram setMyCommands registered successfully");
            } else {
                logger.warn("Telegram setMyCommands failed: {}", root.path("description").asText());
            }
            return ok;
        } catch (Exception e) {
            logger.error("Failed to set Telegram commands", e);
            return false;
        }
    }
}
