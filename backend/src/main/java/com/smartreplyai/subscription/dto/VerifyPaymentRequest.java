package com.smartreplyai.subscription.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyPaymentRequest {

    @NotBlank(message = "Plan code is required")
    private String planCode;

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotBlank(message = "Payment ID is required")
    private String paymentId;

    private String signature;
    private Boolean isSimulated = false;

    public VerifyPaymentRequest() {
    }

    public VerifyPaymentRequest(String planCode, String orderId, String paymentId, String signature, Boolean isSimulated) {
        this.planCode = planCode;
        this.orderId = orderId;
        this.paymentId = paymentId;
        this.signature = signature;
        this.isSimulated = isSimulated;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public Boolean getIsSimulated() {
        return isSimulated;
    }

    public void setIsSimulated(Boolean simulated) {
        isSimulated = simulated;
    }
}
