package com.smartreplyai.ai;

import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.assistant.AssistantService;
import com.smartreplyai.assistant.GeminiChatClient;
import com.smartreplyai.assistant.TenantAssistantContext;
import com.smartreplyai.assistant.dto.AssistantTurn;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.subscription.PlanLimitService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);
    private static final Set<String> TRANSACTIONAL_APPOINTMENT_REPLIES = Set.of(
            "Appointment Booked", "Available Slots", "Slots Unavailable");

    private final AiConfigurationRepository aiConfigurationRepository;
    private final KnowledgeArticleRepository knowledgeArticleRepository;
    private final BusinessRepository businessRepository;
    private final com.smartreplyai.servicecatalog.ServiceItemRepository serviceItemRepository;
    private final com.smartreplyai.staff.StaffRepository staffRepository;
    private final AiProvider aiProvider;
    private final GeminiChatClient geminiChatClient;
    private final TenantAssistantContext tenantAssistantContext;
    private final AssistantService assistantService;
    private final PlanLimitService planLimitService;

    public AiService(AiConfigurationRepository aiConfigurationRepository,
                     KnowledgeArticleRepository knowledgeArticleRepository,
                     BusinessRepository businessRepository,
                     com.smartreplyai.servicecatalog.ServiceItemRepository serviceItemRepository,
                     com.smartreplyai.staff.StaffRepository staffRepository,
                     AiProvider aiProvider,
                     GeminiChatClient geminiChatClient,
                     TenantAssistantContext tenantAssistantContext,
                     AssistantService assistantService,
                     PlanLimitService planLimitService) {
        this.aiConfigurationRepository = aiConfigurationRepository;
        this.knowledgeArticleRepository = knowledgeArticleRepository;
        this.businessRepository = businessRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffRepository = staffRepository;
        this.aiProvider = aiProvider;
        this.geminiChatClient = geminiChatClient;
        this.tenantAssistantContext = tenantAssistantContext;
        this.assistantService = assistantService;
        this.planLimitService = planLimitService;
    }

    @Transactional(readOnly = true)
    public AiGenerationResponse processIncomingMessage(UUID businessId, String customerMessage, List<String> history) {
        return processIncomingMessage(businessId, customerMessage, history, null, null, false);
    }

    @Transactional(readOnly = true)
    public AiGenerationResponse processIncomingMessage(UUID businessId, String customerMessage, List<String> history,
                                                       String customerPhone, String customerName) {
        return processIncomingMessage(businessId, customerMessage, history, customerPhone, customerName, false);
    }

    @Transactional(readOnly = true)
    public AiGenerationResponse processIncomingMessage(UUID businessId, String customerMessage, List<String> history,
                                                       String customerPhone, String customerName, boolean isFirstMessage) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        AiConfiguration config = aiConfigurationRepository.findByBusinessId(businessId)
                .orElseGet(() -> new AiConfiguration(business));

        if (!config.isEnabled()) {
            return null; // AI responses turned off by business owner
        }

        List<KnowledgeArticle> approvedKnowledge = knowledgeArticleRepository.findByBusinessIdAndIsActiveTrue(businessId);
        List<com.smartreplyai.servicecatalog.ServiceItem> services = serviceItemRepository.findByBusinessIdAndIsActiveTrue(businessId);
        List<com.smartreplyai.staff.Staff> staffMembers = staffRepository.findByBusinessIdAndIsActiveTrue(businessId);

        AiGenerationRequest req = new AiGenerationRequest();
        req.setBusinessId(businessId);
        req.setBusinessName(business.getName());
        req.setBusinessCategory(business.getCategory());
        req.setBusinessDescription(business.getDescription());
        req.setBusinessPhone(business.getPhone());
        req.setBusinessAddress(business.getAddress());
        req.setOperatingHours(business.getOperatingHoursJson());
        req.setAssistantName(config.getAssistantName());
        req.setTone(config.getTone());
        req.setGreetingMessage(config.getGreetingMessage());
        req.setFirstMessage(isFirstMessage);
        req.setCustomerMessage(customerMessage);
        req.setCustomerPhoneNumber(customerPhone);
        req.setCustomerName(customerName);
        req.setConversationHistory(history);
        req.setApprovedKnowledge(approvedKnowledge);
        req.setServices(services);
        req.setStaffMembers(staffMembers);
        req.setConfidenceThreshold(config.getConfidenceThreshold().doubleValue());
        req.setFallbackMessage(config.getFallbackMessage());

        AiGenerationResponse exact = aiProvider.generateReply(req);
        // 1. Transactional appointment booking and slot availability must use exact business logic
        if (exact != null && exact.getMatchedQuestion() != null && TRANSACTIONAL_APPOINTMENT_REPLIES.contains(exact.getMatchedQuestion())) {
            return exact;
        }

        // 2. Gemini Assistant Response (Dynamic AI grounded in full workspace context)
        AiGenerationResponse gemini = geminiAssistantReply(businessId, req, history);
        if (gemini != null) {
            return gemini;
        }

        // 3. Fallback to rule-based grounded reply if confident
        if (exact != null && exact.getReplyText() != null && !exact.isEscalated()) {
            return exact;
        }

        // 4. Fallback to Assistant grounded workspace reply
        String assistantFallback = assistantService.generateGroundedReply(businessId, customerMessage);
        if (assistantFallback != null && !assistantFallback.isBlank()) {
            return new AiGenerationResponse(assistantFallback, 0.85, false, null, "Assistant Grounded", 0, 5L, "RULE_BASED");
        }

        return exact;
    }

    private AiGenerationResponse geminiAssistantReply(UUID businessId, AiGenerationRequest req, List<String> history) {
        if (geminiChatClient == null || !geminiChatClient.isConfigured()) {
            return null;
        }
        if (planLimitService != null && !planLimitService.canUseGeminiCustomerReply(businessId)) {
            logger.info("Gemini customer reply skipped for business {} — plan Gemini limit reached", businessId);
            return null;
        }
        long started = System.currentTimeMillis();
        try {
            String prompt = tenantAssistantContext.build(businessId);
            List<AssistantTurn> turns = parseHistoryToTurns(history);
            String reply = geminiChatClient.reply(prompt, req.getCustomerMessage(), turns);
            if (reply == null || reply.isBlank()) {
                return null;
            }
            if (planLimitService != null) {
                planLimitService.recordGeminiCustomerReply(businessId);
            }
            logger.info("Gemini customer reply for business {}", businessId);
            return new AiGenerationResponse(reply.trim(), 0.95, false, null, "Gemini", 0,
                    System.currentTimeMillis() - started, "GEMINI");
        } catch (BadRequestException ex) {
            logger.warn("Gemini Assistant reply skipped for business {}: {}", businessId, ex.getMessage());
            return null;
        } catch (Exception ex) {
            logger.warn("Gemini Assistant call failed for business {}: {}", businessId, ex.getMessage());
            return null;
        }
    }

    private List<AssistantTurn> parseHistoryToTurns(List<String> history) {
        List<AssistantTurn> turns = new ArrayList<>();
        if (history != null) {
            for (String item : history) {
                if (item == null || item.isBlank()) continue;
                if (item.startsWith("user: ")) {
                    turns.add(new AssistantTurn("user", item.substring(6).trim()));
                } else if (item.startsWith("assistant: ")) {
                    turns.add(new AssistantTurn("assistant", item.substring(11).trim()));
                } else {
                    turns.add(new AssistantTurn("user", item.trim()));
                }
            }
        }
        return turns;
    }

    private String groundingPrompt(AiGenerationRequest req) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You reply to one WhatsApp customer for ")
                .append(req.getBusinessName() == null ? "this business" : req.getBusinessName())
                .append(". Use only the facts below. ");
        prompt.append("If a price, time, or policy is not listed, say you do not have that detail. ");
        prompt.append("Do not invent prices, discounts, medical advice, or appointment times. ");
        prompt.append("Do not say a booking is confirmed. Keep the reply under 80 words.\n");
        if (req.getTone() != null && !req.getTone().isBlank()) {
            prompt.append("Tone: ").append(req.getTone()).append('\n');
        }
        prompt.append("Services:\n");
        if (req.getServices() == null || req.getServices().isEmpty()) {
            prompt.append("- No services listed\n");
        } else {
            for (ServiceItem service : req.getServices()) {
                prompt.append("- ").append(service.getName())
                        .append(" (").append(service.getDurationMinutes()).append(" min, ₹")
                        .append(service.getPrice() == null ? "0" : service.getPrice().stripTrailingZeros().toPlainString())
                        .append(")\n");
            }
        }
        prompt.append("FAQs:\n");
        if (req.getApprovedKnowledge() == null || req.getApprovedKnowledge().isEmpty()) {
            prompt.append("- None\n");
        } else {
            for (KnowledgeArticle article : req.getApprovedKnowledge()) {
                prompt.append("- Q: ").append(article.getQuestion()).append(" A: ").append(article.getAnswer()).append('\n');
            }
        }
        prompt.append("Staff:\n");
        if (req.getStaffMembers() == null || req.getStaffMembers().isEmpty()) {
            prompt.append("- None listed\n");
        } else {
            for (Staff staff : req.getStaffMembers()) {
                prompt.append("- ").append(staff.getName()).append('\n');
            }
        }
        if (req.getFallbackMessage() != null && !req.getFallbackMessage().isBlank()) {
            prompt.append("If you cannot answer, use this fallback: ").append(req.getFallbackMessage()).append('\n');
        }
        return prompt.toString();
    }

    @Transactional(readOnly = true)
    public List<String> generateSuggestedReplies(UUID businessId, String incomingMessage) {
        List<String> suggestions = new ArrayList<>();
        AiGenerationResponse resp = processIncomingMessage(businessId, incomingMessage, List.of());
        if (resp != null && resp.getReplyText() != null && !resp.isEscalated()) {
            suggestions.add(resp.getReplyText());
        }
        suggestions.add("Thank you for reaching out! A representative will connect with you shortly.");
        suggestions.add("Could you please provide more details so we can assist you better?");
        return suggestions;
    }

    @Transactional(readOnly = true)
    public AiConfiguration getConfig(UUID businessId) {
        return aiConfigurationRepository.findByBusinessId(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("AI configuration not found"));
    }

    @Transactional
    public AiConfiguration updateConfig(UUID businessId, String assistantName, String tone,
                                       String greeting, String fallback, Double confidence, Boolean enabled) {
        AiConfiguration config = aiConfigurationRepository.findByBusinessId(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("AI configuration not found"));

        if (assistantName != null && !assistantName.isBlank()) config.setAssistantName(assistantName.trim());
        if (tone != null) config.setTone(tone);
        if (greeting != null) config.setGreetingMessage(greeting);
        if (fallback != null) config.setFallbackMessage(fallback);
        if (confidence != null) config.setConfidenceThreshold(java.math.BigDecimal.valueOf(confidence));
        if (enabled != null) config.setEnabled(enabled);

        return aiConfigurationRepository.save(config);
    }
}
