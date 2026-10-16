package com.smartreplyai.subscription;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.subscription.dto.CheckoutOrderDto;
import com.smartreplyai.subscription.dto.PendingPaymentDto;
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

    @Mock
    private com.smartreplyai.customer.CustomerRepository customerRepository;

    @Mock
    private com.smartreplyai.knowledgebase.KnowledgeArticleRepository articleRepository;

    @Mock
    private com.smartreplyai.appointment.AppointmentRepository appointmentRepository;

    @Mock
    private PlanLimitService planLimitService;

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
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(planRepository.findByCode("GROWTH")).thenReturn(Optional.of(growthPlan));
        when(paymentTransactionRepository.findByReferenceCode(any())).thenReturn(Optional.empty());
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        CheckoutOrderDto order = subscriptionService.createCheckoutOrder(businessId, "GROWTH");

        assertNotNull(order);
        assertEquals("GROWTH", order.getPlanCode());
        assertEquals(new BigDecimal("999.00"), order.getAmountInr());
        assertEquals(new BigDecimal("1179"), order.getAmountDueInr());
        assertTrue(order.getReferenceCode().startsWith("SR-"));
        assertNotNull(order.getOrderId());
    }

    @Test
    void testSubmitUpiPaymentWaitsForOwner() {
        PaymentTransaction awaiting = new PaymentTransaction(
                business, growthPlan, "UPI", "order_123", null, null, new BigDecimal("1179"), "AWAITING_PAYMENT");
        awaiting.setReferenceCode("SR-7K2M");
        when(paymentTransactionRepository.findByBusinessIdAndOrderId(businessId, "order_123")).thenReturn(Optional.of(awaiting));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(subscription));
        when(conversationRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(0L);
        when(paymentTransactionRepository.findByBusinessIdOrderByCreatedAtDesc(businessId)).thenReturn(List.of(awaiting));

        VerifyPaymentRequest req = new VerifyPaymentRequest("GROWTH", "order_123", "123456789012", null, false);
        req.setPaymentMethod("UPI");
        req.setUpiId("prakashrajkalamathavan@okicici");

        SubscriptionDetailsDto updated = subscriptionService.verifyAndActivateSubscription(businessId, req);

        assertEquals("STARTER", updated.getPlanCode());
        assertEquals("PENDING_REVIEW", awaiting.getStatus());
        assertEquals("123456789012", awaiting.getUtr());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void testOwnerConfirmActivatesPlan() {
        PaymentTransaction waiting = new PaymentTransaction(
                business, growthPlan, "UPI", "order_123", "123456789012", null, new BigDecimal("1179"), "PENDING_REVIEW");
        waiting.setId(UUID.randomUUID());
        waiting.setReferenceCode("SR-7K2M");
        when(paymentTransactionRepository.findById(waiting.getId())).thenReturn(Optional.of(waiting));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        PendingPaymentDto confirmed = subscriptionService.confirmReceivedPayment(waiting.getId());

        assertEquals("SUCCESS", confirmed.getStatus());
        assertEquals("GROWTH", subscription.getPlan().getCode());
        assertEquals("ACTIVE", subscription.getStatus());
        verify(subscriptionRepository).save(subscription);
    }

    @Test
    void testOwnerRejectLeavesPlanUnchanged() {
        PaymentTransaction waiting = new PaymentTransaction(
                business, growthPlan, "UPI", "order_123", "123456789012", null, new BigDecimal("1179"), "PENDING_REVIEW");
        waiting.setId(UUID.randomUUID());
        when(paymentTransactionRepository.findById(waiting.getId())).thenReturn(Optional.of(waiting));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        PendingPaymentDto rejected = subscriptionService.rejectPayment(waiting.getId());

        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("STARTER", subscription.getPlan().getCode());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void testSubmitWithoutUtrIsRejected() {
        VerifyPaymentRequest req = new VerifyPaymentRequest("GROWTH", "order_123", "12", null, false);
        req.setPaymentMethod("UPI");

        assertThrows(BadRequestException.class, () -> subscriptionService.verifyAndActivateSubscription(businessId, req));
        verify(subscriptionRepository, never()).save(any());
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
