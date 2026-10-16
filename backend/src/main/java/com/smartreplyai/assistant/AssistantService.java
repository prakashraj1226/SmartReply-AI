package com.smartreplyai.assistant;

import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.ai.provider.RuleBasedKnowledgeAiProvider;
import com.smartreplyai.assistant.dto.AssistantChatRequest;
import com.smartreplyai.assistant.dto.AssistantChatResponse;
import com.smartreplyai.assistant.dto.AssistantStatusDto;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.staff.StaffRepository;
import com.smartreplyai.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    private final GeminiChatClient geminiChatClient;
    private final TenantAssistantContext tenantAssistantContext;
    private final com.smartreplyai.subscription.PlanLimitService planLimitService;
    private final BusinessRepository businessRepository;
    private final KnowledgeArticleRepository knowledgeArticleRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final StaffRepository staffRepository;
    private final RuleBasedKnowledgeAiProvider ruleBasedKnowledgeAiProvider;

    public AssistantService(GeminiChatClient geminiChatClient,
                            TenantAssistantContext tenantAssistantContext,
                            com.smartreplyai.subscription.PlanLimitService planLimitService,
                            BusinessRepository businessRepository,
                            KnowledgeArticleRepository knowledgeArticleRepository,
                            ServiceItemRepository serviceItemRepository,
                            StaffRepository staffRepository,
                            RuleBasedKnowledgeAiProvider ruleBasedKnowledgeAiProvider) {
        this.geminiChatClient = geminiChatClient;
        this.tenantAssistantContext = tenantAssistantContext;
        this.planLimitService = planLimitService;
        this.businessRepository = businessRepository;
        this.knowledgeArticleRepository = knowledgeArticleRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffRepository = staffRepository;
        this.ruleBasedKnowledgeAiProvider = ruleBasedKnowledgeAiProvider;
    }

    public AssistantStatusDto status() {
        boolean configured = true;
        String model = geminiChatClient.isConfigured() ? geminiChatClient.getModel() : "SmartReply Grounded AI";
        String provider = geminiChatClient.isConfigured() ? "gemini" : "smartreply-grounded";
        return new AssistantStatusDto(configured, model, provider);
    }

    public AssistantChatResponse chat(AssistantChatRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("Select a business workspace first. The assistant answers only for the current business.");
        }
        return chatForBusiness(businessId, request.getMessage(), request.getHistory());
    }

    public AssistantChatResponse chatForBusiness(UUID businessId, String message, List<com.smartreplyai.assistant.dto.AssistantTurn> history) {
        if (businessId == null) {
            throw new BadRequestException("Business workspace ID is required.");
        }

        // Enforce daily/plan limits for AI Assistant
        planLimitService.checkAiAssistantLimit(businessId);

        String reply = null;
        String modelUsed = "smartreply-grounded";

        if (geminiChatClient.isConfigured()) {
            try {
                String prompt = tenantAssistantContext.build(businessId);
                reply = geminiChatClient.reply(prompt, message, history);
                modelUsed = geminiChatClient.getModel();
            } catch (Exception ex) {
                logger.warn("Gemini call failed: {}. Falling back to grounded workspace AI.", ex.getMessage());
            }
        }

        if (reply == null || reply.isBlank()) {
            reply = generateGroundedReply(businessId, message);
        }

        // Increment usage count for today
        planLimitService.incrementAiAssistantUsage(businessId);

        return new AssistantChatResponse(reply, modelUsed);
    }

    public String generateGroundedReply(UUID businessId, String userMessage) {
        Business business = businessRepository.findById(businessId).orElse(null);
        String bizName = business != null ? business.getName() : "our business";
        String cleanMsg = userMessage != null ? userMessage.trim().toLowerCase() : "";

        if (cleanMsg.contains("what is your name") || cleanMsg.contains("who are you") || cleanMsg.equals("name?")) {
            return "Hello! I am SmartReply Bot, your automated AI assistant for " + bizName + ". I answer questions about our services, pricing, operating hours, staff, and appointments.";
        }

        if (cleanMsg.contains("what can you do") || cleanMsg.contains("what do you do") || cleanMsg.contains("how can you help") || cleanMsg.equals("help")) {
            return "I can answer questions regarding " + bizName + "—including our services & pricing catalog, opening hours, practitioners/specialists, FAQs, and appointment bookings.";
        }

        if (cleanMsg.contains("how are you") || cleanMsg.contains("how do you do")) {
            return "I'm doing great, thank you! How can I assist you with " + bizName + " today?";
        }

        if (ruleBasedKnowledgeAiProvider != null && business != null) {
            List<KnowledgeArticle> articles = knowledgeArticleRepository.findByBusinessIdAndIsActiveTrue(businessId);
            List<ServiceItem> services = serviceItemRepository.findByBusinessIdAndIsActiveTrue(businessId);
            List<Staff> staffMembers = staffRepository.findByBusinessIdAndIsActiveTrue(businessId);

            AiGenerationRequest req = new AiGenerationRequest();
            req.setBusinessId(businessId);
            req.setBusinessName(business.getName());
            req.setBusinessCategory(business.getCategory());
            req.setBusinessDescription(business.getDescription());
            req.setOperatingHours(business.getOperatingHoursJson());
            req.setAssistantName("SmartReply Bot");
            req.setTone("FRIENDLY");
            req.setCustomerMessage(userMessage);
            req.setApprovedKnowledge(articles);
            req.setServices(services);
            req.setStaffMembers(staffMembers);
            req.setConfidenceThreshold(0.40);

            AiGenerationResponse resp = ruleBasedKnowledgeAiProvider.generateReply(req);
            if (resp != null && resp.getReplyText() != null && !resp.isEscalated()) {
                return resp.getReplyText();
            }

            // Service inquiry check
            if (cleanMsg.contains("service") || cleanMsg.contains("price") || cleanMsg.contains("cost")) {
                if (services != null && !services.isEmpty()) {
                    StringBuilder sb = new StringBuilder("Here are the services available at " + bizName + ":\n");
                    for (ServiceItem s : services) {
                        sb.append(String.format("• %s (%d mins - ₹%.0f)\n", s.getName(), s.getDurationMinutes(), s.getPrice()));
                    }
                    return sb.toString().trim();
                }
            }

            // Staff inquiry check
            if (cleanMsg.contains("staff") || cleanMsg.contains("doctor") || cleanMsg.contains("team") || cleanMsg.contains("specialist")) {
                if (staffMembers != null && !staffMembers.isEmpty()) {
                    StringBuilder sb = new StringBuilder("Our team at " + bizName + " includes:\n");
                    for (Staff st : staffMembers) {
                        sb.append(String.format("• %s (%s)\n", st.getName(), st.getStaffType()));
                    }
                    return sb.toString().trim();
                }
            }

            // Hours inquiry check
            if (cleanMsg.contains("hour") || cleanMsg.contains("time") || cleanMsg.contains("open") || cleanMsg.contains("close")) {
                String hours = business.getOperatingHoursJson();
                return "Operating hours for " + bizName + " are: " + (hours != null && !hours.isBlank() ? hours : "Monday - Saturday 09:00 AM - 07:00 PM");
            }
        }

        return "I am SmartReply Bot for " + bizName + ". You can ask me about our services, pricing, operating hours, specialists, and available appointment times!";
    }
}
