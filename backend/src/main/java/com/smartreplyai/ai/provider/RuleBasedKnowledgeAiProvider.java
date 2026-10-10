package com.smartreplyai.ai.provider;

import com.smartreplyai.ai.AiProvider;
import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class RuleBasedKnowledgeAiProvider implements AiProvider {

    @Override
    public String getProviderName() {
        return "GROUNDED_KNOWLEDGE_ENGINE";
    }

    @Override
    public AiGenerationResponse generateReply(AiGenerationRequest req) {
        long startTime = System.currentTimeMillis();
        String customerText = req.getCustomerMessage() != null ? req.getCustomerMessage().trim().toLowerCase() : "";

        // Handle common greetings gracefully
        if (isGreeting(customerText)) {
            String greeting = req.getAssistantName() != null
                    ? "Hello! I am " + req.getAssistantName() + ", automated assistant for " + req.getBusinessName() + ". How may I assist you today?"
                    : "Hello! How can I help you today?";
            long elapsed = System.currentTimeMillis() - startTime;
            return new AiGenerationResponse(greeting, 0.98, false, null, "Greeting", 25, elapsed, getProviderName());
        }

        KnowledgeArticle bestMatch = null;
        double highestScore = 0.0;

        if (req.getApprovedKnowledge() != null) {
            for (KnowledgeArticle article : req.getApprovedKnowledge()) {
                if (!article.isActive()) continue;

                double score = calculateMatchScore(customerText, article);
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = article;
                }
            }
        }

        long elapsed = System.currentTimeMillis() - startTime;

        if (bestMatch != null && highestScore >= req.getConfidenceThreshold()) {
            String tailoredReply = formatWithTone(bestMatch.getAnswer(), req.getTone());
            return new AiGenerationResponse(
                    tailoredReply,
                    highestScore,
                    false,
                    bestMatch.getId(),
                    bestMatch.getQuestion(),
                    tailoredReply.split("\\s+").length * 2,
                    elapsed,
                    getProviderName()
            );
        }

        // Fallback: below confidence threshold
        String fallback = req.getFallbackMessage() != null && !req.getFallbackMessage().isBlank()
                ? req.getFallbackMessage()
                : "I apologize, but I don't have that specific information right now. Let me connect you with one of our team members.";

        return new AiGenerationResponse(
                fallback,
                highestScore,
                true,
                null,
                null,
                fallback.split("\\s+").length * 2,
                elapsed,
                getProviderName()
        );
    }

    private boolean isGreeting(String text) {
        if (text == null || text.isBlank()) return false;
        String clean = text.replaceAll("[^a-zA-Z0-9 ]", " ").replaceAll("\\s+", " ").trim();
        Set<String> greetings = Set.of("hi", "hello", "hey", "good morning", "good evening", "good afternoon", "namaste", "hola");
        if (greetings.contains(clean)) return true;
        for (String g : greetings) {
            if (clean.equals(g) || clean.startsWith(g + " ") || clean.endsWith(" " + g) || clean.contains(" " + g + " ")) {
                return true;
            }
        }
        return false;
    }

    private double calculateMatchScore(String query, KnowledgeArticle article) {
        String qClean = query.replaceAll("[^a-zA-Z0-9 ]", "").toLowerCase();
        String questionClean = article.getQuestion().replaceAll("[^a-zA-Z0-9 ]", "").toLowerCase();

        // Exact match
        if (questionClean.equals(qClean)) return 0.99;
        if (questionClean.contains(qClean) || qClean.contains(questionClean)) return 0.92;

        Set<String> queryWords = new HashSet<>(Arrays.asList(qClean.split("\\s+")));
        Set<String> questionWords = new HashSet<>(Arrays.asList(questionClean.split("\\s+")));

        // Common stopwords removal
        Set<String> stopwords = Set.of("what", "is", "are", "your", "the", "how", "do", "i", "can", "to", "for", "in", "a", "an", "please");
        queryWords.removeAll(stopwords);
        questionWords.removeAll(stopwords);

        if (queryWords.isEmpty() || questionWords.isEmpty()) return 0.0;

        int matches = 0;
        for (String qw : queryWords) {
            if (questionWords.contains(qw)) {
                matches++;
            }
        }

        double wordOverlapScore = (double) matches / Math.min(queryWords.size(), questionWords.size());

        // Check keywords
        double keywordScore = 0.0;
        if (article.getKeywords() != null && !article.getKeywords().isBlank()) {
            String[] kwList = article.getKeywords().toLowerCase().split(",");
            for (String kw : kwList) {
                String cleanKw = kw.trim();
                if (!cleanKw.isEmpty() && qClean.contains(cleanKw)) {
                    keywordScore += 0.25;
                }
            }
        }

        double totalScore = Math.min(0.95, wordOverlapScore * 0.7 + keywordScore);
        return Math.round(totalScore * 100.0) / 100.0;
    }

    private String formatWithTone(String answer, String tone) {
        if (tone == null) tone = "PROFESSIONAL";
        return switch (tone.toUpperCase()) {
            case "FRIENDLY" -> answer + " Feel free to let us know if you have any questions!";
            case "EMPATHETIC" -> "We understand and are here to help. " + answer;
            case "CONCISE" -> answer.trim();
            default -> answer; // PROFESSIONAL
        };
    }
}
