package com.smartreplyai.telegram.client;

import com.smartreplyai.whatsapp.IntegrationAccount;

public interface TelegramClient {

    TelegramSendResult sendMessage(IntegrationAccount account, String chatId, String textContent);

    TelegramBotInfo getMe(String botToken);

    boolean verifyCredentials(IntegrationAccount account);

    boolean setWebhook(String botToken, String webhookUrl, String secretToken);

    boolean setMyCommands(String botToken);
}
