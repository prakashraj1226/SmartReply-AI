package com.smartreplyai.whatsapp.client;

public class WhatsAppSendResult {

    private boolean success;
    private String messageId;
    private String status;
    private String errorMessage;
    private boolean simulated;

    public WhatsAppSendResult() {
    }

    public WhatsAppSendResult(boolean success, String messageId, String status, String errorMessage, boolean simulated) {
        this.success = success;
        this.messageId = messageId;
        this.status = status;
        this.errorMessage = errorMessage;
        this.simulated = simulated;
    }

    public static WhatsAppSendResult ok(String messageId, boolean simulated) {
        return new WhatsAppSendResult(true, messageId, "SENT", null, simulated);
    }

    public static WhatsAppSendResult failure(String errorMessage, boolean simulated) {
        return new WhatsAppSendResult(false, null, "FAILED", errorMessage, simulated);
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public boolean isSimulated() {
        return simulated;
    }

    public void setSimulated(boolean simulated) {
        this.simulated = simulated;
    }
}
