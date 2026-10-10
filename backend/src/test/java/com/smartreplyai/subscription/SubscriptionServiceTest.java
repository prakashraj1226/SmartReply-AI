package com.smartreplyai.subscription;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.subscription.dto.CheckoutOrderDto;
import com.smartreplyai.subscription.dto.SubscriptionDetailsDto;
import com.smartreplyai.subscription.dto.VerifyPaymentRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private SubscriptionPlanRepository planRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private UUID businessId;
    private Business business;
    private SubscriptionPlan starterPlan;
    private SubscriptionPlan growthPlan;
    private Subscription subscription;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        business = new Business("SmileCare Dental", "smilecare", "CLINIC", "care@smilecare.com", "+919876543210");
        business.setId(businessId);

        starterPlan = new SubscriptionPlan();
        starterPlan.setId(UUID.randomUUID());
        starterPlan.setCode("STARTER");
        starterPlan.setName("Starter Plan");
        starterPlan.setPriceInr(new BigDecimal("499.00"));
        starterPlan.setMaxConversationsMonthly(500);
        starterPlan.setMaxAgents(1);
        starterPlan.setAiFeaturesEnabled(true);

        growthPlan = new SubscriptionPlan();
        growthPlan.setId(UUID.randomUUID());
        growthPlan.setCode("GROWTH");
        growthPlan.setName("Growth Plan");
        growthPlan.setPriceInr(new BigDecimal("999.00"));
        growthPlan.setMaxConversationsMonthly(2000);
        growthPlan.setMaxAgents(5);
        growthPlan.setAiFeaturesEnabled(true);

        subscription = new Subscription(business, starterPlan, Instant.now().minus(5, ChronoUnit.DAYS), Instant.now().plus(25, ChronoUnit.DAYS));
        subscription.setId(UUID.randomUUID());
    }

    @Test
    void testGetSubscriptionDetails() {
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(subscription));
        when(conversationRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(45L);
        when(paymentTransactionRepository.findByBusinessIdOrderByCreatedAtDesc(businessId)).thenReturn(List.of());

        SubscriptionDetailsDto dto = subscriptionService.getSubscriptionDetails(businessId);

        assertNotNull(dto);
        assertEquals("STARTER", dto.getPlanCode());
        assertEquals(500, dto.getMaxConversationsMonthly());
        assertEquals(45L, dto.getCurrentMonthConversations());
        assertEquals(455L, dto.getRemainingConversations());
    }

    @Test
    void testCreateCheckoutOrder() {
        when(planRepository.findByCode("GROWTH")).thenReturn(Optional.of(growthPlan));

        CheckoutOrderDto order = subscriptionService.createCheckoutOrder(businessId, "GROWTH");

        assertNotNull(order);
        assertEquals("GROWTH", order.getPlanCode());
        assertEquals(new BigDecimal("999.00"), order.getAmountInr());
        assertNotNull(order.getOrderId());
    }

    @Test
    void testVerifyAndActivateSubscription() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(planRepository.findByCode("GROWTH")).thenReturn(Optional.of(growthPlan));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));
        when(conversationRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(0L);

        VerifyPaymentRequest req = new VerifyPaymentRequest("GROWTH", "order_123", "pay_456", "sig_789", true);

        SubscriptionDetailsDto updated = subscriptionService.verifyAndActivateSubscription(businessId, req);

        assertNotNull(updated);
        assertEquals("GROWTH", updated.getPlanCode());
        assertEquals("ACTIVE", updated.getStatus());
        verify(paymentTransactionRepository).save(any(PaymentTransaction.class));
        verify(subscriptionRepository).save(subscription);
    }

    @Test
    void testCanInitiateConversation_WhenUnderLimit_ReturnsTrue() {
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(subscription));
        when(conversationRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(100L);

        boolean canInitiate = subscriptionService.canInitiateConversation(businessId);
        assertTrue(canInitiate);
    }

    @Test
    void testCanInitiateConversation_WhenLimitReached_ReturnsFalse() {
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(subscription));
        when(conversationRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(500L);

        boolean canInitiate = subscriptionService.canInitiateConversation(businessId);
        assertFalse(canInitiate);
    }
}
