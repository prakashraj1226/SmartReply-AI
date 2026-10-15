package com.smartreplyai.subscription.dto;

import com.smartreplyai.subscription.PaymentTransaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class PendingPaymentDto {

    private UUID id;
    private String businessName;
    private String planName;
    private String planCode;
    private BigDecimal amountInr;
    private String referenceCode;
    private String utr;
    private String upiId;
    private String status;
    private Instant createdAt;

    public static PendingPaymentDto fromEntity(PaymentTransaction tx) {
        PendingPaymentDto dto = new PendingPaymentDto();
        dto.setId(tx.getId());
        if (tx.getBusiness() != null) {
            dto.setBusinessName(tx.getBusiness().getName());
        }
        if (tx.getPlan() != null) {
            dto.setPlanName(tx.getPlan().getName());
            dto.setPlanCode(tx.getPlan().getCode());
        }
        dto.setAmountInr(tx.getAmountInr());
        dto.setReferenceCode(tx.getReferenceCode());
        dto.setUtr(tx.getUtr());
        dto.setUpiId(tx.getUpiId());
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

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
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

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
    }

    public String getUtr() {
        return utr;
    }

    public void setUtr(String utr) {
        this.utr = utr;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
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
