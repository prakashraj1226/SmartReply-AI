package com.smartreplyai.subscription;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "gemini_reply_daily_usage", uniqueConstraints = {
        @UniqueConstraint(name = "uk_gemini_reply_daily_usage", columnNames = {"business_id", "usage_date"})
})
public class GeminiReplyDailyUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "reply_count", nullable = false)
    private int replyCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public GeminiReplyDailyUsage() {
    }

    public GeminiReplyDailyUsage(Business business, LocalDate usageDate, int replyCount) {
        this.business = business;
        this.usageDate = usageDate;
        this.replyCount = replyCount;
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

    public Business getBusiness() {
        return business;
    }

    public LocalDate getUsageDate() {
        return usageDate;
    }

    public int getReplyCount() {
        return replyCount;
    }

    public void setReplyCount(int replyCount) {
        this.replyCount = replyCount;
    }
}
