package com.smartreplyai.automation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.automation.dto.AutomationExecutionDto;
import com.smartreplyai.automation.dto.AutomationRuleDto;
import com.smartreplyai.automation.dto.CreateAutomationRuleRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.notification.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AutomationEngineService {

    private static final Logger logger = LoggerFactory.getLogger(AutomationEngineService.class);

    private final AutomationRuleRepository ruleRepository;
    private final AutomationExecutionRepository executionRepository;
    private final BusinessRepository businessRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public AutomationEngineService(AutomationRuleRepository ruleRepository,
                                   AutomationExecutionRepository executionRepository,
                                   BusinessRepository businessRepository,
                                   NotificationService notificationService,
                                   ObjectMapper objectMapper) {
        this.ruleRepository = ruleRepository;
        this.executionRepository = executionRepository;
        this.businessRepository = businessRepository;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<AutomationRuleDto> getRules(UUID businessId) {
        return ruleRepository.findByBusinessIdOrderByCreatedAtDesc(businessId)
                .stream()
                .map(AutomationRuleDto::fromEntity)
                .toList();
    }

    @Transactional
    public AutomationRuleDto createRule(UUID businessId, CreateAutomationRuleRequest req) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        AutomationRule rule = new AutomationRule(
                business,
                req.getName().trim(),
                req.getTriggerEvent().trim().toUpperCase(),
                req.getConditionsJson(),
                req.getActionsJson()
        );

        rule = ruleRepository.save(rule);
        return AutomationRuleDto.fromEntity(rule);
    }

    @Transactional
    public AutomationRuleDto updateRule(UUID businessId, UUID id, CreateAutomationRuleRequest req) {
        AutomationRule rule = ruleRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found"));

        rule.setName(req.getName().trim());
        rule.setTriggerEvent(req.getTriggerEvent().trim().toUpperCase());
        rule.setConditionsJson(req.getConditionsJson());
        rule.setActionsJson(req.getActionsJson());

        rule = ruleRepository.save(rule);
        return AutomationRuleDto.fromEntity(rule);
    }

    @Transactional
    public AutomationRuleDto toggleRule(UUID businessId, UUID id) {
        AutomationRule rule = ruleRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found"));

        rule.setActive(!rule.isActive());
        rule = ruleRepository.save(rule);
        return AutomationRuleDto.fromEntity(rule);
    }

    @Transactional
    public void deleteRule(UUID businessId, UUID id) {
        AutomationRule rule = ruleRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found"));
        ruleRepository.delete(rule);
    }

    @Transactional(readOnly = true)
    public Page<AutomationExecutionDto> getExecutions(UUID businessId, Pageable pageable) {
        return executionRepository.findByBusinessIdOrderByExecutedAtDesc(businessId, pageable)
                .map(AutomationExecutionDto::fromEntity);
    }

    /**
     * Executes all active automation rules matching a specific trigger event
     */
    @Transactional
    public void triggerEvent(UUID businessId, String triggerEvent, Map<String, Object> context) {
        List<AutomationRule> activeRules = ruleRepository.findByBusinessIdAndTriggerEventAndIsActiveTrue(businessId, triggerEvent);
        if (activeRules.isEmpty()) return;

        Business business = businessRepository.findById(businessId).orElse(null);
        if (business == null) return;

        for (AutomationRule rule : activeRules) {
            try {
                executeRuleActions(business, rule, context);
                AutomationExecution execution = new AutomationExecution(business, rule, triggerEvent, "SUCCESS", null);
                executionRepository.save(execution);
                logger.info("Automation rule '{}' executed successfully for trigger {}", rule.getName(), triggerEvent);
            } catch (Exception e) {
                logger.error("Automation rule '{}' execution failed", rule.getName(), e);
                AutomationExecution execution = new AutomationExecution(business, rule, triggerEvent, "FAILED", e.getMessage());
                executionRepository.save(execution);
            }
        }
    }

    private void executeRuleActions(Business business, AutomationRule rule, Map<String, Object> context) throws Exception {
        if (rule.getActionsJson() == null || rule.getActionsJson().isBlank()) return;

        JsonNode actionsNode = objectMapper.readTree(rule.getActionsJson());
        if (!actionsNode.isArray()) return;

        for (JsonNode action : actionsNode) {
            String type = action.path("type").asText().toUpperCase();

            switch (type) {
                case "NOTIFY_USER", "SEND_NOTIFICATION" -> {
                    String title = action.path("title").asText("Automation Alert: " + rule.getName());
                    String msg = action.path("message").asText("Action executed automatically for event " + rule.getTriggerEvent());
                    notificationService.createNotification(business.getId(), null, title, msg, "INFO", "/inbox");
                }
                case "SEND_REPLY" -> {
                    String replyText = action.path("textContent").asText();
                    logger.info("Rule '{}' triggered reply: {}", rule.getName(), replyText);
                }
                default -> logger.info("Executed generic action {} for rule {}", type, rule.getName());
            }
        }
    }
}
