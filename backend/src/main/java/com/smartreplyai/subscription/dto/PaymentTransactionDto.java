package com.smartreplyai.subscription.dto;

import com.smartreplyai.subscription.PaymentTransaction;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class PaymentTransactionDto {

    private UUID id;
    private String planName;
    private String gateway;
    private String paymentId;
    private BigDecimal amountInr;
    private String status;
    private Instant createdAt;

    public PaymentTransactionDto() {
    }

    public static PaymentTransactionDto fromEntity(PaymentTransaction tx) {
        PaymentTransactionDto dto = new PaymentTransactionDto();
        dto.setId(tx.getId());
        if (tx.getPlan() != null) dto.setPlanName(tx.getPlan().getName());
        dto.setGateway(tx.getGateway());
        dto.setPaymentId(tx.getPaymentId());
        dto.setAmountInr(tx.getAmountInr());
        dto.setStatus(tx.getStatus());
        dto.setCreatedAt(tx.getCreatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public BigDecimal getAmountInr() {
        return amountInr;
    }

    public void setAmountInr(BigDecimal amountInr) {
        this.amountInr = amountInr;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
