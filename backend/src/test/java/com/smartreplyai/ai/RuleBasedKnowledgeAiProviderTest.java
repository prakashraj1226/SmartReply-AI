package com.smartreplyai.ai;

import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.ai.provider.RuleBasedKnowledgeAiProvider;
import com.smartreplyai.business.Business;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RuleBasedKnowledgeAiProviderTest {

    private RuleBasedKnowledgeAiProvider provider;

    @BeforeEach
    void setUp() {
        provider = new RuleBasedKnowledgeAiProvider();
    }

    @Test
    void generateReply_WhenQuestionMatchesKnowledge_ShouldReturnGroundedAnswer() {
        Business biz = new Business();
        biz.setName("SmileCare Dental Hospital");

        KnowledgeArticle article1 = new KnowledgeArticle(biz, null,
                "What are your clinic operating hours?",
                "We are open Monday through Saturday from 9:00 AM to 7:00 PM. Closed on Sundays.");
        article1.setKeywords("hours, timings, open, timing");

        KnowledgeArticle article2 = new KnowledgeArticle(biz, null,
                "What are your dental implant charges?",
                "Dental implants start from ₹25,000 per tooth.");
        article2.setKeywords("implants, cost, price");

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("SmileCare Dental Hospital");
        req.setAssistantName("SmileCare AI");
        req.setCustomerMessage("What are your clinic timings?");
        req.setApprovedKnowledge(List.of(article1, article2));
        req.setConfidenceThreshold(0.70);
        req.setTone("PROFESSIONAL");

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated(), "Should not escalate when confident answer exists");
        assertTrue(resp.getConfidenceScore() >= 0.70);
        assertEquals("We are open Monday through Saturday from 9:00 AM to 7:00 PM. Closed on Sundays.", resp.getReplyText());
        assertEquals(article1.getQuestion(), resp.getMatchedQuestion());
    }

    @Test
    void generateReply_WhenNoKnowledgeMatches_ShouldTriggerFallbackWithoutHallucination() {
        Business biz = new Business();
        biz.setName("SmileCare Dental Hospital");

        KnowledgeArticle article = new KnowledgeArticle(biz, null,
                "What are your clinic operating hours?",
                "We are open Monday through Saturday from 9:00 AM to 7:00 PM.");

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("SmileCare Dental Hospital");
        req.setCustomerMessage("Do you offer heart surgery and what is the cost?");
        req.setApprovedKnowledge(List.of(article));
        req.setConfidenceThreshold(0.70);
        req.setFallbackMessage("Sorry, I don't have that information. Transferring to our human team.");

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertTrue(resp.isEscalated(), "Should trigger escalation for unapproved query");
        assertTrue(resp.getReplyText().contains("Transferring to our human team"));
        assertNull(resp.getMatchedArticleId());
    }

    @Test
    void generateReply_WhenCustomerSendsGreeting_ShouldReturnPoliteIntroduction() {
        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessName("SmileCare Dental");
        req.setAssistantName("SmileCare AI");
        req.setCustomerMessage("Hello, good morning!");
        req.setApprovedKnowledge(List.of());

        AiGenerationResponse resp = provider.generateReply(req);

        assertNotNull(resp);
        assertFalse(resp.isEscalated());
        assertTrue(resp.getReplyText().contains("SmileCare AI"));
    }
}
