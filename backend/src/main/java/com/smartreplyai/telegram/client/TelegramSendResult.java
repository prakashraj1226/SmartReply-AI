package com.smartreplyai.telegram.client;

public class TelegramSendResult {

    private boolean success;
    private String messageId;
    private boolean simulated;
    private String errorMessage;

    public TelegramSendResult() {
    }

    public TelegramSendResult(boolean success, String messageId, boolean simulated, String errorMessage) {
        this.success = success;
        this.messageId = messageId;
        this.simulated = simulated;
        this.errorMessage = errorMessage;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public boolean isSimulated() {
        return simulated;
    }

    public void setSimulated(boolean simulated) {
        this.simulated = simulated;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
