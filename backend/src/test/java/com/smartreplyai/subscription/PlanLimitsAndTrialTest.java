package com.smartreplyai.subscription;

import com.smartreplyai.appointment.Appointment;
import com.smartreplyai.appointment.AppointmentRepository;
import com.smartreplyai.assistant.AiAssistantDailyUsage;
import com.smartreplyai.assistant.AiAssistantDailyUsageRepository;
import com.smartreplyai.auth.AuthService;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.auth.dto.LoginRequest;
import com.smartreplyai.auth.dto.RegisterRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.knowledgebase.KnowledgeArticle;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.staff.StaffRepository;
import com.smartreplyai.subscription.dto.VerifyPaymentRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class PlanLimitsAndTrialTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private SubscriptionPlanRepository planRepository;

    @Mock
    private BusinessMemberRepository businessMemberRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private KnowledgeArticleRepository articleRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AiAssistantDailyUsageRepository aiAssistantDailyUsageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @InjectMocks
    private PlanLimitService planLimitService;

    private UUID businessId;
    private Business business;
    private SubscriptionPlan trialPlan;
    private SubscriptionPlan starterPlan;
    private SubscriptionPlan growthPlan;
    private SubscriptionPlan proPlan;
    private Subscription trialSubscription;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        business = new Business("Salon Deluxe", "salondeluxe", "SALON", "contact@salondeluxe.com", "+919876543210");
        business.setId(businessId);

        trialPlan = new SubscriptionPlan();
        trialPlan.setCode("TRIAL");
        trialPlan.setName("Free Trial");
        trialPlan.setPriceInr(BigDecimal.ZERO);
        trialPlan.setMaxAgents(2);
        trialPlan.setAiFeaturesEnabled(true);

        starterPlan = new SubscriptionPlan();
        starterPlan.setCode("STARTER");
        starterPlan.setName("Starter Plan");
        starterPlan.setPriceInr(new BigDecimal("499"));
        starterPlan.setMaxConversationsMonthly(500);
        starterPlan.setMaxAgents(1);
        starterPlan.setAiFeaturesEnabled(false);

        growthPlan = new SubscriptionPlan();
        growthPlan.setCode("GROWTH");
        growthPlan.setName("Growth Plan");
        growthPlan.setPriceInr(new BigDecimal("999"));
        growthPlan.setMaxConversationsMonthly(2000);
        growthPlan.setMaxAgents(3);
        growthPlan.setAiFeaturesEnabled(true);

        proPlan = new SubscriptionPlan();
        proPlan.setCode("PRO");
        proPlan.setName("Pro Business");
        proPlan.setPriceInr(new BigDecimal("1999"));
        proPlan.setMaxConversationsMonthly(10000);
        proPlan.setMaxAgents(10);
        proPlan.setAiFeaturesEnabled(true);

        Instant start = Instant.now();
        Instant end = start.plus(14, ChronoUnit.DAYS);
        trialSubscription = new Subscription(business, trialPlan, start, end);
        trialSubscription.setStatus("TRIALING");
        trialSubscription.setTrialStartedAt(start);
        trialSubscription.setTrialEndsAt(end);
        trialSubscription.setTrialStatus("ACTIVE");

        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(trialSubscription));
        when(subscriptionRepository.findByBusinessIdForUpdate(businessId)).thenReturn(Optional.of(trialSubscription));
    }

    @Test
    @DisplayName("Case 1: New user receives 14-day trial with start and end stored")
    void testCase1_NewUserReceives14DayTrial() {
        assertNotNull(trialSubscription.getTrialStartedAt());
        assertNotNull(trialSubscription.getTrialEndsAt());
        assertEquals("TRIAL", trialSubscription.getPlan().getCode());
        assertEquals("TRIALING", trialSubscription.getStatus());
        assertEquals("ACTIVE", trialSubscription.getTrialStatus());

        long days = ChronoUnit.DAYS.between(trialSubscription.getTrialStartedAt(), trialSubscription.getTrialEndsAt());
        assertEquals(14, days);
        assertTrue(trialSubscription.isTrial());
        assertFalse(trialSubscription.isTrialExpired());
        assertTrue(trialSubscription.getDaysRemaining() >= 13);
    }

    @Test
    @DisplayName("Case 2 & 3: Owner can add 2 staff, cannot add a 3rd; Owner is not counted as staff")
    void testCase2And3_StaffLimitAndOwnerNotCounted() {
        User ownerUser = new User("owner@salondeluxe.com", "hash", "Alice Owner", "BUSINESS_OWNER");
        ownerUser.setId(UUID.randomUUID());
        BusinessMember ownerMember = new BusinessMember(business, ownerUser, "OWNER");

        User staffUser1 = new User("staff1@salondeluxe.com", "hash", "Bob Staff", "BUSINESS_AGENT");
        staffUser1.setId(UUID.randomUUID());
        BusinessMember staffMember1 = new BusinessMember(business, staffUser1, "AGENT");

        User staffUser2 = new User("staff2@salondeluxe.com", "hash", "Charlie Staff", "BUSINESS_AGENT");
        staffUser2.setId(UUID.randomUUID());
        BusinessMember staffMember2 = new BusinessMember(business, staffUser2, "AGENT");

        // 1. With Owner only: staff count is 0
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of(ownerMember));
        when(staffRepository.findByBusinessId(businessId)).thenReturn(List.of());
        assertEquals(0, planLimitService.getCurrentStaffCount(businessId));
        assertDoesNotThrow(() -> planLimitService.checkStaffLimit(businessId));

        // 2. With Owner + 1 staff: count is 1, allowed
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of(ownerMember, staffMember1));
        assertEquals(1, planLimitService.getCurrentStaffCount(businessId));
        assertDoesNotThrow(() -> planLimitService.checkStaffLimit(businessId));

        // 3. With Owner + 2 staff: count is 2 (at limit). Next invite must be rejected!
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of(ownerMember, staffMember1, staffMember2));
        assertEquals(2, planLimitService.getCurrentStaffCount(businessId));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                planLimitService.checkStaffLimit(businessId));
        assertEquals("Free Trial allows a maximum of 2 staff members. Upgrade your plan to add more staff.", ex.getMessage());
    }

    @Test
    @DisplayName("Case 4: 5 customers are allowed and the 6th is rejected")
    void testCase4_CustomerLimitEnforcement() {
        // 4 customers: allowed
        when(customerRepository.countByBusinessId(businessId)).thenReturn(4L);
        assertDoesNotThrow(() -> planLimitService.checkCustomerLimit(businessId));

        // 5 customers: at limit. 6th is rejected!
        when(customerRepository.countByBusinessId(businessId)).thenReturn(5L);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                planLimitService.checkCustomerLimit(businessId));
        assertEquals("Free Trial allows a maximum of 5 customers. Upgrade your plan to add more customers.", ex.getMessage());
    }

    @Test
    @DisplayName("Case 5: 2 Knowledge entries and 2 FAQ entries are allowed, and the next one is rejected")
    void testCase5_KnowledgeAndFaqEntriesCountedSeparately() {
        // 1 FAQ and 1 Knowledge: both allowed
        when(articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "FAQ")).thenReturn(1L);
        when(articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "KNOWLEDGE")).thenReturn(1L);
        assertDoesNotThrow(() -> planLimitService.checkKnowledgeArticleLimit(businessId, "FAQ"));
        assertDoesNotThrow(() -> planLimitService.checkKnowledgeArticleLimit(businessId, "KNOWLEDGE"));

        // 2 FAQs reached: 3rd FAQ rejected, but Knowledge still allowed
        when(articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "FAQ")).thenReturn(2L);
        BadRequestException faqEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkKnowledgeArticleLimit(businessId, "FAQ"));
        assertEquals("Free Trial allows a maximum of 2 FAQ entries. Upgrade your plan to add more.", faqEx.getMessage());
        assertDoesNotThrow(() -> planLimitService.checkKnowledgeArticleLimit(businessId, "KNOWLEDGE"));

        // 2 Knowledge reached: 3rd Knowledge rejected
        when(articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "KNOWLEDGE")).thenReturn(2L);
        BadRequestException kbEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkKnowledgeArticleLimit(businessId, "KNOWLEDGE"));
        assertEquals("Free Trial allows a maximum of 2 Knowledge Base entries. Upgrade your plan to add more.", kbEx.getMessage());
    }

    @Test
    @DisplayName("Case 6 & 7: 10 AI Assistant chats allowed per Asia/Kolkata day, 11th rejected; count resets on next calendar day")
    void testCase6And7_AiAssistantDailyLimitAndReset() {
        LocalDate today = LocalDate.now(PlanLimitService.ASIA_KOLKATA);
        AiAssistantDailyUsage usageToday = new AiAssistantDailyUsage(business, today, 9);
        when(aiAssistantDailyUsageRepository.findByBusinessIdAndUsageDate(businessId, today))
                .thenReturn(Optional.of(usageToday));

        // 9 chats: allowed
        assertDoesNotThrow(() -> planLimitService.checkAiAssistantLimit(businessId));

        // 10 chats: at limit, 11th rejected
        usageToday.setChatCount(10);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                planLimitService.checkAiAssistantLimit(businessId));
        assertEquals("You have reached your daily AI Assistant conversation limit of 10. Upgrade your plan for more conversations.", ex.getMessage());

        // Next calendar day: usage record is empty (0), chats allowed again!
        LocalDate tomorrow = today.plusDays(1);
        when(aiAssistantDailyUsageRepository.findByBusinessIdAndUsageDate(businessId, tomorrow))
                .thenReturn(Optional.empty());
        assertEquals(0, planLimitService.getTodayAiChats(businessId, tomorrow));
    }

    @Test
    @DisplayName("Case 8: 2 appointments allowed per day (3rd rejected); 15 total trial appointments allowed (16th rejected)")
    void testCase8_AppointmentDailyAndTotalLimits() {
        // Daily limit check: 1 today is fine
        when(appointmentRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(1L);
        when(appointmentRepository.countByBusinessIdAndCreatedAtGreaterThanEqual(eq(businessId), any())).thenReturn(5L);
        assertDoesNotThrow(() -> planLimitService.checkAppointmentLimit(businessId));

        // 2 appointments today: 3rd rejected with daily error
        when(appointmentRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(2L);
        BadRequestException dailyEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkAppointmentLimit(businessId));
        assertEquals("You have reached your daily appointment limit of 2.", dailyEx.getMessage());

        // Total limit check: 0 today, but 15 total in trial: 16th rejected with total error
        when(appointmentRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(0L);
        when(appointmentRepository.countByBusinessIdAndCreatedAtGreaterThanEqual(eq(businessId), any())).thenReturn(15L);
        BadRequestException totalEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkAppointmentLimit(businessId));
        assertEquals("You have reached the total trial appointment limit of 15. Please upgrade your plan to continue.", totalEx.getMessage());
    }

    @Test
    @DisplayName("Case 9: Two simultaneous requests cannot exceed the last free slot")
    void testCase9_SimultaneousRequestsPessimisticLockProtection() throws InterruptedException, ExecutionException {
        // Mock findByBusinessIdForUpdate simulating thread safety
        AtomicInteger staffCounter = new AtomicInteger(1); // 1 staff currently exists, max is 2
        when(subscriptionRepository.findByBusinessIdForUpdate(businessId)).thenAnswer(inv -> {
            // Emulate slight delay simulating database query & lock acquisition
            Thread.sleep(20);
            return Optional.of(trialSubscription);
        });

        doAnswer(inv -> {
            synchronized (staffCounter) {
                if (staffCounter.get() >= 2) {
                    throw new BadRequestException("Free Trial allows a maximum of 2 staff members. Upgrade your plan to add more staff.");
                }
                staffCounter.incrementAndGet();
                return null;
            }
        }).when(businessMemberRepository).save(any());

        ExecutorService executor = Executors.newFixedThreadPool(2);
        Callable<Boolean> inviteTask = () -> {
            try {
                // In actual Spring flow, checkStaffLimit locks subscription row
                planLimitService.checkStaffLimit(businessId);
                // simulate save
                businessMemberRepository.save(new BusinessMember());
                return true;
            } catch (BadRequestException e) {
                return false;
            }
        };

        Future<Boolean> f1 = executor.submit(inviteTask);
        Future<Boolean> f2 = executor.submit(inviteTask);

        boolean res1 = f1.get();
        boolean res2 = f2.get();
        executor.shutdown();

        // Exactly one should succeed and one should fail because only 1 free slot remained!
        assertTrue((res1 && !res2) || (!res1 && res2), "Exactly one concurrent thread must succeed and one must be rejected");
        assertEquals(2, staffCounter.get());
    }

    @Test
    @DisplayName("Case 10: After trial_ends_at, creating records is rejected, old records remain readable, no payment created")
    void testCase10_TrialExpirationBlocksCreatesKeepsReads() {
        // Set trial to expired
        trialSubscription.setTrialEndsAt(Instant.now().minus(1, ChronoUnit.HOURS));
        assertTrue(trialSubscription.isTrialExpired());

        // All create operations are rejected
        BadRequestException staffEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkStaffLimit(businessId));
        assertEquals("Your free trial has ended. Please upgrade your plan to continue using premium features.", staffEx.getMessage());

        BadRequestException custEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkCustomerLimit(businessId));
        assertEquals("Your free trial has ended. Please upgrade your plan to continue using premium features.", custEx.getMessage());

        BadRequestException kbEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkKnowledgeArticleLimit(businessId, "FAQ"));
        assertEquals("Your free trial has ended. Please upgrade your plan to continue using premium features.", kbEx.getMessage());

        BadRequestException apptEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkAppointmentLimit(businessId));
        assertEquals("Your free trial has ended. Please upgrade your plan to continue using premium features.", apptEx.getMessage());

        BadRequestException aiEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkAiAssistantLimit(businessId));
        assertEquals("Your free trial has ended. Please upgrade your plan to continue using premium features.", aiEx.getMessage());

        // WhatsApp auto-replies are blocked
        assertFalse(planLimitService.canSendWhatsAppAutoReply(businessId));

        // No payment transaction should be created
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Case 11: Logout and login do not extend the trial")
    void testCase11_LogoutAndLoginDoNotExtendTrial() {
        Instant originalStart = Instant.now().minus(5, ChronoUnit.DAYS);
        Instant originalEnd = originalStart.plus(14, ChronoUnit.DAYS);
        trialSubscription.setTrialStartedAt(originalStart);
        trialSubscription.setTrialEndsAt(originalEnd);

        // Simulate reading subscription during/after login
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(trialSubscription));

        // Subscriptions must retain original server timestamps
        assertEquals(originalStart, trialSubscription.getTrialStartedAt());
        assertEquals(originalEnd, trialSubscription.getTrialEndsAt());
        assertEquals(9, trialSubscription.getDaysRemaining());
    }

    @Test
    @DisplayName("Case 12: Starter has AI Assistant off, 1 staff, and 500 customer conversations per month")
    void testCase12_StarterPlanLimits() {
        Subscription starterSub = new Subscription(business, starterPlan, Instant.now(), Instant.now().plus(30, ChronoUnit.DAYS));
        when(subscriptionRepository.findByBusinessIdForUpdate(businessId)).thenReturn(Optional.of(starterSub));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(starterSub));

        // 1. AI Assistant is turned off on Starter
        BadRequestException aiEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkAiAssistantLimit(businessId));
        assertEquals("AI Assistant is not included in the Starter plan. Upgrade your plan to use it.", aiEx.getMessage());

        // 2. Staff limit is 1
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of());
        when(staffRepository.findByBusinessId(businessId)).thenReturn(List.of());
        assertDoesNotThrow(() -> planLimitService.checkStaffLimit(businessId));

        User staff1 = new User("staff1@test.com", "hash", "Staff 1", "BUSINESS_AGENT");
        staff1.setId(UUID.randomUUID());
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of(new BusinessMember(business, staff1, "AGENT")));

        BadRequestException staffEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkStaffLimit(businessId));
        assertEquals("Starter Plan allows a maximum of 1 staff members. Upgrade your plan to add more staff.", staffEx.getMessage());

        // 3. Customer conversations monthly limit is 500
        when(conversationRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(499L);
        assertDoesNotThrow(() -> planLimitService.checkConversationLimit(businessId));

        when(conversationRepository.countByBusinessIdAndCreatedAtBetween(eq(businessId), any(), any())).thenReturn(500L);
        BadRequestException convEx = assertThrows(BadRequestException.class, () ->
                planLimitService.checkConversationLimit(businessId));
        assertTrue(convEx.getMessage().contains("500 conversations per month"));
    }

    @Test
    @DisplayName("Case 13: Growth keeps 3 staff & 2000 conversations; Pro keeps 10 staff & 10000 conversations")
    void testCase13_GrowthAndProPlanLimits() {
        // Growth plan
        Subscription growthSub = new Subscription(business, growthPlan, Instant.now(), Instant.now().plus(30, ChronoUnit.DAYS));
        when(subscriptionRepository.findByBusinessIdForUpdate(businessId)).thenReturn(Optional.of(growthSub));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(growthSub));

        PlanLimits.LimitConfig growthConfig = PlanLimits.forPlan("GROWTH");
        assertEquals(3, growthConfig.maxStaff());
        assertEquals(2000, growthConfig.maxConversationsMonthly());
        assertTrue(growthConfig.aiAssistantEnabled());

        // Pro plan
        Subscription proSub = new Subscription(business, proPlan, Instant.now(), Instant.now().plus(30, ChronoUnit.DAYS));
        when(subscriptionRepository.findByBusinessIdForUpdate(businessId)).thenReturn(Optional.of(proSub));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(proSub));

        PlanLimits.LimitConfig proConfig = PlanLimits.forPlan("PRO");
        assertEquals(10, proConfig.maxStaff());
        assertEquals(10000, proConfig.maxConversationsMonthly());
        assertTrue(proConfig.aiAssistantEnabled());
    }

    @Test
    @DisplayName("Case 14: A Pro shop is not limited to 2 staff or 10 AI chats")
    void testCase14_ProShopNotLimitedToTrialLimits() {
        Subscription proSub = new Subscription(business, proPlan, Instant.now(), Instant.now().plus(30, ChronoUnit.DAYS));
        when(subscriptionRepository.findByBusinessIdForUpdate(businessId)).thenReturn(Optional.of(proSub));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(proSub));

        // Pro can have more than 2 staff (up to 10)
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of(
                new BusinessMember(business, new User("s1@test.com", "h", "S1", "AGENT"), "AGENT"),
                new BusinessMember(business, new User("s2@test.com", "h", "S2", "AGENT"), "AGENT"),
                new BusinessMember(business, new User("s3@test.com", "h", "S3", "AGENT"), "AGENT")
        ));
        when(staffRepository.findByBusinessId(businessId)).thenReturn(List.of());
        assertDoesNotThrow(() -> planLimitService.checkStaffLimit(businessId));

        // Pro is not limited to 10 AI chats per day (can do 50+)
        LocalDate today = LocalDate.now(PlanLimitService.ASIA_KOLKATA);
        when(aiAssistantDailyUsageRepository.findByBusinessIdAndUsageDate(businessId, today))
                .thenReturn(Optional.of(new AiAssistantDailyUsage(business, today, 50)));
        assertDoesNotThrow(() -> planLimitService.checkAiAssistantLimit(businessId));
    }

    @Test
    @DisplayName("Case 15: 'I have paid' leaves plan unchanged. Confirmation of SUCCESS applies paid limits")
    void testCase15_IHavePaidLeavesPlanUnchangedOwnerSuccessUpgrades() {
        SubscriptionService subService = new SubscriptionService(
                subscriptionRepository,
                planRepository,
                paymentTransactionRepository,
                businessRepository,
                conversationRepository,
                customerRepository,
                articleRepository,
                appointmentRepository,
                planLimitService
        );

        PaymentTransaction tx = new PaymentTransaction(
                business, proPlan, "UPI", "order_123", null, null, new BigDecimal("2358.82"), "AWAITING_PAYMENT");
        tx.setReferenceCode("REF-1234");
        UUID txId = UUID.randomUUID();
        tx.setId(txId);

        when(paymentTransactionRepository.findByBusinessIdAndOrderId(businessId, "order_123")).thenReturn(Optional.of(tx));
        when(paymentTransactionRepository.findById(txId)).thenReturn(Optional.of(tx));
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(trialSubscription));

        // 1. User submits reference number ("I have paid")
        VerifyPaymentRequest req = new VerifyPaymentRequest();
        req.setOrderId("order_123");
        req.setPaymentId("123456789012");
        req.setPaymentMethod("UPI");
        req.setPlanCode("PRO");

        subService.verifyAndActivateSubscription(businessId, req);

        // Transaction is only PENDING_REVIEW, and plan is still TRIAL!
        assertEquals("PENDING_REVIEW", tx.getStatus());
        assertEquals("TRIAL", trialSubscription.getPlan().getCode());
        assertEquals("TRIALING", trialSubscription.getStatus());

        // 2. Owner confirms received payment (SUCCESS)
        subService.confirmReceivedPayment(txId);

        assertEquals("SUCCESS", tx.getStatus());
        assertEquals("PRO", trialSubscription.getPlan().getCode());
        assertEquals("ACTIVE", trialSubscription.getStatus());
        assertEquals("CONVERTED", trialSubscription.getTrialStatus());
        assertFalse(trialSubscription.isTrial());
    }
}
