package com.smartreplyai.subscription;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(nullable = false, length = 50)
    private String gateway = "SIMULATED"; // RAZORPAY, SIMULATED

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "payment_id")
    private String paymentId;

    private String signature;

    @Column(name = "amount_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountInr;

    @Column(nullable = false, length = 50)
    private String status = "SUCCESS"; // AWAITING_PAYMENT, PENDING_REVIEW, SUCCESS, REJECTED, FAILED, REFUNDED

    @Column(name = "reference_code", length = 20)
    private String referenceCode;

    @Column(length = 64)
    private String utr;

    @Column(name = "upi_id", length = 120)
    private String upiId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PaymentTransaction() {
    }

    public PaymentTransaction(Business business, SubscriptionPlan plan, String gateway,
                              String orderId, String paymentId, String signature,
                              BigDecimal amountInr, String status) {
        this.business = business;
        this.plan = plan;
        this.gateway = gateway;
        this.orderId = orderId;
        this.paymentId = paymentId;
        this.signature = signature;
        this.amountInr = amountInr;
        this.status = status;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public SubscriptionPlan getPlan() {
        return plan;
    }

    public void setPlan(SubscriptionPlan plan) {
        this.plan = plan;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
