package com.smartreplyai.automation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.automation.dto.AutomationRuleDto;
import com.smartreplyai.automation.dto.CreateAutomationRuleRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomationEngineServiceTest {

    @Mock
    private AutomationRuleRepository ruleRepository;

    @Mock
    private AutomationExecutionRepository executionRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private NotificationService notificationService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AutomationEngineService automationEngineService;

    private UUID businessId;
    private Business business;
    private AutomationRule rule;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        business = new Business("SmileCare Dental", "smilecare", "CLINIC", "care@smilecare.com", "+919876543210");
        business.setId(businessId);

        rule = new AutomationRule(
                business,
                "Welcome First Time Customer",
                "FIRST_MESSAGE_RECEIVED",
                "{}",
                "[{\"type\":\"NOTIFY_USER\",\"title\":\"New Lead\",\"message\":\"A new customer texted!\"}]"
        );
        rule.setId(UUID.randomUUID());
    }

    @Test
    void testCreateRule() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(ruleRepository.save(any(AutomationRule.class))).thenAnswer(i -> {
            AutomationRule r = i.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        CreateAutomationRuleRequest req = new CreateAutomationRuleRequest(
                "Welcome Greeting", "FIRST_MESSAGE_RECEIVED", "{}", "[{\"type\":\"SEND_REPLY\",\"textContent\":\"Hi!\"}]"
        );

        AutomationRuleDto result = automationEngineService.createRule(businessId, req);

        assertNotNull(result);
        assertEquals("Welcome Greeting", result.getName());
        assertEquals("FIRST_MESSAGE_RECEIVED", result.getTriggerEvent());
        assertTrue(result.isActive());
        verify(ruleRepository).save(any(AutomationRule.class));
    }

    @Test
    void testToggleRule() {
        when(ruleRepository.findByBusinessIdAndId(businessId, rule.getId())).thenReturn(Optional.of(rule));
        when(ruleRepository.save(any(AutomationRule.class))).thenAnswer(i -> i.getArgument(0));

        assertTrue(rule.isActive());
        AutomationRuleDto toggled = automationEngineService.toggleRule(businessId, rule.getId());
        assertFalse(toggled.isActive());
    }

    @Test
    void testTriggerEvent_ExecutesActionAndLogsSuccess() {
        when(ruleRepository.findByBusinessIdAndTriggerEventAndIsActiveTrue(businessId, "FIRST_MESSAGE_RECEIVED"))
                .thenReturn(List.of(rule));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(executionRepository.save(any(AutomationExecution.class))).thenAnswer(i -> i.getArgument(0));

        automationEngineService.triggerEvent(businessId, "FIRST_MESSAGE_RECEIVED", Map.of("customerId", UUID.randomUUID()));

        // Verify notification service was called according to rule's action
        verify(notificationService).createNotification(eq(businessId), isNull(), eq("New Lead"), eq("A new customer texted!"), eq("INFO"), eq("/inbox"));
        // Verify execution was recorded
        verify(executionRepository).save(argThat(exec -> "SUCCESS".equals(exec.getStatus()) && "FIRST_MESSAGE_RECEIVED".equals(exec.getTriggerEvent())));
    }
}
