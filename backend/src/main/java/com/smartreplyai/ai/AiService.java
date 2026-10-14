package com.smartreplyai.ai;

import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AiService {

    private final AiConfigurationRepository aiConfigurationRepository;
    private final KnowledgeArticleRepository knowledgeArticleRepository;
    private final BusinessRepository businessRepository;
    private final com.smartreplyai.servicecatalog.ServiceItemRepository serviceItemRepository;
    private final com.smartreplyai.staff.StaffRepository staffRepository;
    private final AiProvider aiProvider;

    public AiService(AiConfigurationRepository aiConfigurationRepository,
                     KnowledgeArticleRepository knowledgeArticleRepository,
                     BusinessRepository businessRepository,
                     com.smartreplyai.servicecatalog.ServiceItemRepository serviceItemRepository,
                     com.smartreplyai.staff.StaffRepository staffRepository,
                     AiProvider aiProvider) {
        this.aiConfigurationRepository = aiConfigurationRepository;
        this.knowledgeArticleRepository = knowledgeArticleRepository;
        this.businessRepository = businessRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffRepository = staffRepository;
        this.aiProvider = aiProvider;
    }

    @Transactional(readOnly = true)
    public AiGenerationResponse processIncomingMessage(UUID businessId, String customerMessage, List<String> history) {
        return processIncomingMessage(businessId, customerMessage, history, null, null);
    }

    @Transactional(readOnly = true)
    public AiGenerationResponse processIncomingMessage(UUID businessId, String customerMessage, List<String> history,
                                                       String customerPhone, String customerName) {
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
        req.setOperatingHours(business.getOperatingHoursJson());
        req.setAssistantName(config.getAssistantName());
        req.setTone(config.getTone());
        req.setCustomerMessage(customerMessage);
        req.setCustomerPhoneNumber(customerPhone);
        req.setCustomerName(customerName);
        req.setConversationHistory(history);
        req.setApprovedKnowledge(approvedKnowledge);
        req.setServices(services);
        req.setStaffMembers(staffMembers);
        req.setConfidenceThreshold(config.getConfidenceThreshold().doubleValue());
        req.setFallbackMessage(config.getFallbackMessage());

        return aiProvider.generateReply(req);
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
