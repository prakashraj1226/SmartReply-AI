package com.smartreplyai.knowledgebase.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class CreateArticleRequest {

    private UUID categoryId;

    @NotBlank(message = "Question is required")
    private String question;

    @NotBlank(message = "Answer is required")
    private String answer;

    private String keywords;
    private Boolean isActive = true;
    private String type = "FAQ";

    public CreateArticleRequest() {
    }

    public CreateArticleRequest(String question, String answer) {
        this.question = question;
        this.answer = answer;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
