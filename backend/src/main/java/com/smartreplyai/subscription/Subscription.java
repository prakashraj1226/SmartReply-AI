package com.smartreplyai.subscription;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_subscriptions_business", columnNames = {"business_id"})
})
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE"; // ACTIVE, PAST_DUE, CANCELLED, TRIALING

    @Column(name = "current_period_start", nullable = false)
    private Instant currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private Instant currentPeriodEnd;

    @Column(name = "cancel_at_period_end", nullable = false)
    private boolean cancelAtPeriodEnd = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Subscription() {
    }

    public Subscription(Business business, SubscriptionPlan plan) {
        this.business = business;
        this.plan = plan;
        this.status = "ACTIVE";
        this.currentPeriodStart = Instant.now();
        this.currentPeriodEnd = Instant.now().plus(30, java.time.temporal.ChronoUnit.DAYS);
        this.cancelAtPeriodEnd = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Subscription(Business business, SubscriptionPlan plan, Instant currentPeriodStart, Instant currentPeriodEnd) {
        this.business = business;
        this.plan = plan;
        this.status = "ACTIVE";
        this.currentPeriodStart = currentPeriodStart;
        this.currentPeriodEnd = currentPeriodEnd;
        this.cancelAtPeriodEnd = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCurrentPeriodStart() {
        return currentPeriodStart;
    }

    public void setCurrentPeriodStart(Instant currentPeriodStart) {
        this.currentPeriodStart = currentPeriodStart;
    }

    public Instant getCurrentPeriodEnd() {
        return currentPeriodEnd;
    }

    public void setCurrentPeriodEnd(Instant currentPeriodEnd) {
        this.currentPeriodEnd = currentPeriodEnd;
    }

    public boolean isCancelAtPeriodEnd() {
        return cancelAtPeriodEnd;
    }

    public void setCancelAtPeriodEnd(boolean cancelAtPeriodEnd) {
        this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
