package com.smartreplyai.whatsapp.client;

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
import java.util.List;
import java.util.Map;

@Component
public class OfficialWhatsAppCloudApiClient implements WhatsAppClient {

    private static final Logger logger = LoggerFactory.getLogger(OfficialWhatsAppCloudApiClient.class);
    private static final String GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OfficialWhatsAppCloudApiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public WhatsAppSendResult sendTextMessage(IntegrationAccount account, String recipientPhone, String textContent) {
        if (account.isSandbox() || account.getAccessToken() == null || account.getPhoneNumberId() == null) {
            logger.info("[WHATSAPP MOCK/SANDBOX] Routing to simulated sender because account is in sandbox or credentials missing.");
            return WhatsAppSendResult.ok("wamid.SIMULATED_" + System.currentTimeMillis(), true);
        }

        try {
            String url = String.format("%s/%s/messages", GRAPH_API_BASE, account.getPhoneNumberId());

            // Normalize phone number (strip spaces, dashes, leading plus if needed)
            String cleanPhone = recipientPhone.replaceAll("[^0-9]", "");

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("recipient_type", "individual");
            body.put("to", cleanPhone);
            body.put("type", "text");
            body.put("text", Map.of("preview_url", false, "body", textContent));

            String jsonPayload = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + account.getAccessToken().trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String wamid = root.path("messages").path(0).path("id").asText();
                logger.info("Official WhatsApp Cloud message sent successfully: wamid={}", wamid);
                return WhatsAppSendResult.ok(wamid, false);
            } else {
                logger.error("WhatsApp Cloud API error HTTP {}: {}", response.statusCode(), response.body());
                return WhatsAppSendResult.failure("WhatsApp API Error: " + response.body(), false);
            }
        } catch (Exception e) {
            logger.error("Exception sending message via WhatsApp Cloud API", e);
            return WhatsAppSendResult.failure(e.getMessage(), false);
        }
    }

    @Override
    public WhatsAppSendResult sendTemplateMessage(IntegrationAccount account, String recipientPhone, String templateName, String languageCode, List<String> parameters) {
        if (account.isSandbox() || account.getAccessToken() == null || account.getPhoneNumberId() == null) {
            return WhatsAppSendResult.ok("wamid.SIMULATED_TPL_" + System.currentTimeMillis(), true);
        }

        try {
            String url = String.format("%s/%s/messages", GRAPH_API_BASE, account.getPhoneNumberId());
            String cleanPhone = recipientPhone.replaceAll("[^0-9]", "");

            Map<String, Object> template = new HashMap<>();
            template.put("name", templateName);
            template.put("language", Map.of("code", languageCode != null ? languageCode : "en"));

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("to", cleanPhone);
            body.put("type", "template");
            body.put("template", template);

            String jsonPayload = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + account.getAccessToken().trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String wamid = root.path("messages").path(0).path("id").asText();
                return WhatsAppSendResult.ok(wamid, false);
            } else {
                return WhatsAppSendResult.failure("Template send error: " + response.body(), false);
            }
        } catch (Exception e) {
            return WhatsAppSendResult.failure(e.getMessage(), false);
        }
    }

    @Override
    public boolean verifyCredentials(IntegrationAccount account) {
        if (account.isSandbox()) return true;
        if (account.getAccessToken() == null || account.getPhoneNumberId() == null) return false;

        try {
            String url = String.format("%s/%s", GRAPH_API_BASE, account.getPhoneNumberId());
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + account.getAccessToken().trim())
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            logger.warn("Verification failed for WhatsApp account {}", account.getPhoneNumberId(), e);
            return false;
        }
    }
}
