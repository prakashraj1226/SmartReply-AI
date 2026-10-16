package com.smartreplyai.assistant;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ai_assistant_daily_usage", uniqueConstraints = {
        @UniqueConstraint(name = "uk_ai_assistant_daily_usage", columnNames = {"business_id", "usage_date"})
})
public class AiAssistantDailyUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "chat_count", nullable = false)
    private int chatCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AiAssistantDailyUsage() {
    }

    public AiAssistantDailyUsage(Business business, LocalDate usageDate, int chatCount) {
        this.business = business;
        this.usageDate = usageDate;
        this.chatCount = chatCount;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

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

    public LocalDate getUsageDate() {
        return usageDate;
    }

    public void setUsageDate(LocalDate usageDate) {
        this.usageDate = usageDate;
    }

    public int getChatCount() {
        return chatCount;
    }

    public void setChatCount(int chatCount) {
        this.chatCount = chatCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
