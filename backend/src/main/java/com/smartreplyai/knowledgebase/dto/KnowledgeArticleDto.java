package com.smartreplyai.knowledgebase.dto;

import com.smartreplyai.knowledgebase.KnowledgeArticle;
import java.time.Instant;
import java.util.UUID;

public class KnowledgeArticleDto {

    private UUID id;
    private UUID businessId;
    private UUID categoryId;
    private String categoryName;
    private String question;
    private String answer;
    private String keywords;
    private boolean isActive;
    private String type;
    private Instant createdAt;
    private Instant updatedAt;

    public KnowledgeArticleDto() {
    }

    public static KnowledgeArticleDto fromEntity(KnowledgeArticle a) {
        KnowledgeArticleDto dto = new KnowledgeArticleDto();
        dto.setId(a.getId());
        dto.setBusinessId(a.getBusiness().getId());
        if (a.getCategory() != null) {
            dto.setCategoryId(a.getCategory().getId());
            dto.setCategoryName(a.getCategory().getName());
        }
        dto.setQuestion(a.getQuestion());
        dto.setAnswer(a.getAnswer());
        dto.setKeywords(a.getKeywords());
        dto.setActive(a.isActive());
        dto.setType(a.getType() != null ? a.getType() : "FAQ");
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBusinessId() {
        return businessId;
    }

    public void setBusinessId(UUID businessId) {
        this.businessId = businessId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
