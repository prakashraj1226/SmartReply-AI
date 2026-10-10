package com.smartreplyai.ai.dto;

import java.util.UUID;

public class AiGenerationResponse {

    private String replyText;
    private double confidenceScore;
    private boolean isEscalated;
    private UUID matchedArticleId;
    private String matchedQuestion;
    private int tokensUsed;
    private long executionTimeMs;
    private String providerUsed;

    public AiGenerationResponse() {
    }

    public AiGenerationResponse(String replyText, double confidenceScore, boolean isEscalated,
                                UUID matchedArticleId, String matchedQuestion, int tokensUsed,
                                long executionTimeMs, String providerUsed) {
        this.replyText = replyText;
        this.confidenceScore = confidenceScore;
        this.isEscalated = isEscalated;
        this.matchedArticleId = matchedArticleId;
        this.matchedQuestion = matchedQuestion;
        this.tokensUsed = tokensUsed;
        this.executionTimeMs = executionTimeMs;
        this.providerUsed = providerUsed;
    }

    public String getReplyText() {
        return replyText;
    }

    public void setReplyText(String replyText) {
        this.replyText = replyText;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public boolean isEscalated() {
        return isEscalated;
    }

    public void setEscalated(boolean escalated) {
        isEscalated = escalated;
    }

    public UUID getMatchedArticleId() {
        return matchedArticleId;
    }

    public void setMatchedArticleId(UUID matchedArticleId) {
        this.matchedArticleId = matchedArticleId;
    }

    public String getMatchedQuestion() {
        return matchedQuestion;
    }

    public void setMatchedQuestion(String matchedQuestion) {
        this.matchedQuestion = matchedQuestion;
    }

    public int getTokensUsed() {
        return tokensUsed;
    }

    public void setTokensUsed(int tokensUsed) {
        this.tokensUsed = tokensUsed;
    }

    public long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public String getProviderUsed() {
        return providerUsed;
    }

    public void setProviderUsed(String providerUsed) {
        this.providerUsed = providerUsed;
    }
}
