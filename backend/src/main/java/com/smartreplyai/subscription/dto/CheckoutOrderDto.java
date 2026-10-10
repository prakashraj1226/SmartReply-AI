package com.smartreplyai.subscription.dto;

import java.math.BigDecimal;

public class CheckoutOrderDto {

    private String orderId;
    private String planCode;
    private BigDecimal amountInr;
    private String keyId;
    private boolean isSimulated;

    public CheckoutOrderDto() {
    }

    public CheckoutOrderDto(String orderId, String planCode, BigDecimal amountInr, String keyId, boolean isSimulated) {
        this.orderId = orderId;
        this.planCode = planCode;
        this.amountInr = amountInr;
        this.keyId = keyId;
        this.isSimulated = isSimulated;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public BigDecimal getAmountInr() {
        return amountInr;
    }

    public void setAmountInr(BigDecimal amountInr) {
        this.amountInr = amountInr;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public boolean isSimulated() {
        return isSimulated;
    }

    public void setSimulated(boolean simulated) {
        isSimulated = simulated;
    }
}
