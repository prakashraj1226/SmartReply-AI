package com.smartreplyai.whatsapp.client;

import com.smartreplyai.whatsapp.IntegrationAccount;
import java.util.List;

public interface WhatsAppClient {

    WhatsAppSendResult sendTextMessage(IntegrationAccount account, String recipientPhone, String textContent);

    WhatsAppSendResult sendTemplateMessage(IntegrationAccount account, String recipientPhone, String templateName, String languageCode, List<String> parameters);

    boolean verifyCredentials(IntegrationAccount account);
}
