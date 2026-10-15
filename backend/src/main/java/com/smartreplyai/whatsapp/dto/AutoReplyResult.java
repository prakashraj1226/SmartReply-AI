package com.smartreplyai.whatsapp.dto;

public class AutoReplyResult {

    private String customerMessage;
    private String replyText;
    private boolean simulated;

    public AutoReplyResult() {
    }

    public AutoReplyResult(String customerMessage, String replyText, boolean simulated) {
        this.customerMessage = customerMessage;
        this.replyText = replyText;
        this.simulated = simulated;
    }

    public String getCustomerMessage() {
        return customerMessage;
    }

    public void setCustomerMessage(String customerMessage) {
        this.customerMessage = customerMessage;
    }

    public String getReplyText() {
        return replyText;
    }

    public void setReplyText(String replyText) {
        this.replyText = replyText;
    }

    public boolean isSimulated() {
        return simulated;
    }

    public void setSimulated(boolean simulated) {
        this.simulated = simulated;
    }
}
