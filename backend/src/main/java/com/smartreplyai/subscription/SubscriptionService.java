package com.smartreplyai.subscription;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.appointment.AppointmentRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.subscription.dto.CheckoutOrderDto;
import com.smartreplyai.subscription.dto.PaymentTransactionDto;
import com.smartreplyai.subscription.dto.PendingPaymentDto;
import com.smartreplyai.subscription.dto.SubscriptionDetailsDto;
import com.smartreplyai.subscription.dto.VerifyPaymentRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BusinessRepository businessRepository;
    private final ConversationRepository conversationRepository;
    private final CustomerRepository customerRepository;
    private final KnowledgeArticleRepository articleRepository;
    private final AppointmentRepository appointmentRepository;
    private final PlanLimitService planLimitService;

    @Value("${app.razorpay.key-id:rzp_test_mock_key}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:rzp_test_mock_secret}")
    private String razorpayKeySecret;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               SubscriptionPlanRepository planRepository,
                               PaymentTransactionRepository paymentTransactionRepository,
                               BusinessRepository businessRepository,
                               ConversationRepository conversationRepository,
                               CustomerRepository customerRepository,
                               KnowledgeArticleRepository articleRepository,
                               AppointmentRepository appointmentRepository,
                               PlanLimitService planLimitService) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.businessRepository = businessRepository;
        this.conversationRepository = conversationRepository;
        this.customerRepository = customerRepository;
        this.articleRepository = articleRepository;
        this.appointmentRepository = appointmentRepository;
        this.planLimitService = planLimitService;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getPlans() {
        return planRepository.findByIsActiveTrueOrderByPriceInrAsc();
    }

    @Transactional
    public Subscription getOrInitSubscription(UUID businessId) {
        return subscriptionRepository.findByBusinessId(businessId)
                .orElseGet(() -> {
                    Business business = businessRepository.findById(businessId)
                            .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
                    SubscriptionPlan defaultPlan = planRepository.findByCode("TRIAL")
                            .orElseGet(() -> planRepository.findByCode("FREE")
                                    .orElseGet(() -> planRepository.findAll().stream().findFirst()
                                            .orElseThrow(() -> new ResourceNotFoundException("Default plan not found"))));

                    Instant start = Instant.now();
                    Instant end = start.plus(14, ChronoUnit.DAYS);
                    Subscription sub = new Subscription(business, defaultPlan, start, end);
                    sub.setStatus("TRIALING");
                    sub.setTrialStartedAt(start);
                    sub.setTrialEndsAt(end);
                    sub.setTrialStatus("ACTIVE");
                    return subscriptionRepository.save(sub);
                });
    }

    @Transactional
    public SubscriptionDetailsDto getSubscriptionDetails(UUID businessId) {
        Subscription sub = getOrInitSubscription(businessId);
        SubscriptionPlan plan = sub.getPlan();

        // Update trial status if expired
        if (sub.isTrialExpired() && !"EXPIRED".equalsIgnoreCase(sub.getTrialStatus())) {
            sub.setTrialStatus("EXPIRED");
            subscriptionRepository.save(sub);
        }

        long currentMonthConversations = conversationRepository.countByBusinessIdAndCreatedAtBetween(
                businessId, sub.getCurrentPeriodStart(), sub.getCurrentPeriodEnd());
        long remaining = Math.max(0, plan.getMaxConversationsMonthly() - currentMonthConversations);

        List<PaymentTransactionDto> transactions = paymentTransactionRepository
                .findByBusinessIdOrderByCreatedAtDesc(businessId)
                .stream()
                .map(PaymentTransactionDto::fromEntity)
                .toList();

        SubscriptionDetailsDto dto = new SubscriptionDetailsDto();
        dto.setId(sub.getId());
        dto.setPlanCode(plan.getCode());
        dto.setPlanName(plan.getName());
        dto.setPriceInr(plan.getPriceInr());
        dto.setStatus(sub.getStatus());
        dto.setCurrentPeriodStart(sub.getCurrentPeriodStart());
        dto.setCurrentPeriodEnd(sub.getCurrentPeriodEnd());
        dto.setCancelAtPeriodEnd(sub.isCancelAtPeriodEnd());
        dto.setMaxConversationsMonthly(plan.getMaxConversationsMonthly());
        dto.setMaxAgents(plan.getMaxAgents());
        dto.setAiFeaturesEnabled(plan.isAiFeaturesEnabled());
        dto.setCurrentMonthConversations(currentMonthConversations);
        dto.setRemainingConversations(remaining);
        dto.setTransactions(transactions);

        // Trial fields
        dto.setTrial(sub.isTrial());
        dto.setTrialExpired(sub.isTrialExpired());
        dto.setDaysRemaining(sub.getDaysRemaining());
        dto.setTrialStartedAt(sub.getTrialStartedAt());
        dto.setTrialEndsAt(sub.getTrialEndsAt());
        dto.setTrialStatus(sub.getTrialStatus());

        // Limits and usage breakdown
        PlanLimits.LimitConfig limits = PlanLimits.forPlan(plan.getCode());
        long staffCount = planLimitService.getCurrentStaffCount(businessId);
        long customerCount = customerRepository.countByBusinessId(businessId);
        long kbCount = articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "KNOWLEDGE");
        long faqCount = articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "FAQ");
        LocalDate today = LocalDate.now(PlanLimitService.ASIA_KOLKATA);
        int todayAiChats = planLimitService.getTodayAiChats(businessId, today);

        Instant startOfDay = today.atStartOfDay(PlanLimitService.ASIA_KOLKATA).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(PlanLimitService.ASIA_KOLKATA).toInstant().minusNanos(1);
        long apptToday = appointmentRepository.countByBusinessIdAndCreatedAtBetween(businessId, startOfDay, endOfDay);
        Instant trialStart = sub.getTrialStartedAt() != null ? sub.getTrialStartedAt() : sub.getCreatedAt();
        long apptTotal = appointmentRepository.countByBusinessIdAndCreatedAtGreaterThanEqual(businessId, trialStart);

        dto.setStaffCount(staffCount);
        dto.setStaffLimit(limits != null ? limits.maxStaff() : plan.getMaxAgents());
        dto.setCustomerCount(customerCount);
        dto.setCustomerLimit(limits != null ? limits.maxCustomers() : Integer.MAX_VALUE);
        dto.setKnowledgeCount(kbCount);
        dto.setKnowledgeLimit(limits != null ? limits.maxKnowledgeEntries() : Integer.MAX_VALUE);
        dto.setFaqCount(faqCount);
        dto.setFaqLimit(limits != null ? limits.maxFaqEntries() : Integer.MAX_VALUE);
        dto.setAiTodayChats(todayAiChats);
        dto.setAiTodayLimit(limits != null ? limits.maxAiAssistantDailyChats() : 0);
        dto.setAppointmentTodayCount(apptToday);
        dto.setAppointmentTodayLimit(limits != null ? limits.maxAppointmentsDaily() : Integer.MAX_VALUE);
        dto.setAppointmentTotalCount(apptTotal);
        dto.setAppointmentTotalLimit(limits != null ? limits.maxAppointmentsTotal() : Integer.MAX_VALUE);

        return dto;
    }

    @Transactional
    public CheckoutOrderDto createCheckoutOrder(UUID businessId, String planCode) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        SubscriptionPlan plan = planRepository.findByCode(planCode.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + planCode));

        String orderId = "order_upi_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        String reference = newReferenceCode();
        BigDecimal amountDue = amountWithGst(plan.getPriceInr());
        boolean isSimulated = "rzp_test_mock_key".equals(razorpayKeyId);

        PaymentTransaction tx = new PaymentTransaction(
                business, plan, "UPI", orderId, null, null, amountDue, "AWAITING_PAYMENT");
        tx.setReferenceCode(reference);
        paymentTransactionRepository.save(tx);

        CheckoutOrderDto order = new CheckoutOrderDto(orderId, plan.getCode(), plan.getPriceInr(), razorpayKeyId, isSimulated);
        order.setReferenceCode(reference);
        order.setAmountDueInr(amountDue);
        return order;
    }

    @Transactional
    public SubscriptionDetailsDto verifyAndActivateSubscription(UUID businessId, VerifyPaymentRequest req) {
        String method = req.getPaymentMethod() == null ? "" : req.getPaymentMethod().trim().toUpperCase();
        if (!"UPI".equals(method)) {
            throw new BadRequestException("Pay with UPI, then submit the reference for confirmation");
        }

        String utr = req.getPaymentId() == null ? "" : req.getPaymentId().trim();
        if (utr.length() < 6 || utr.length() > 64) {
            throw new BadRequestException("Enter the UPI reference number from your payment");
        }

        PaymentTransaction tx = paymentTransactionRepository.findByBusinessIdAndOrderId(businessId, req.getOrderId())
                .orElseThrow(() -> new BadRequestException("Checkout not found. Open Pay again."));
        if (!"AWAITING_PAYMENT".equals(tx.getStatus()) && !"PENDING_REVIEW".equals(tx.getStatus())) {
            throw new BadRequestException("This payment was already reviewed");
        }
        if (tx.getPlan() == null || !tx.getPlan().getCode().equalsIgnoreCase(req.getPlanCode())) {
            throw new BadRequestException("Plan does not match this checkout");
        }

        tx.setStatus("PENDING_REVIEW");
        tx.setUtr(utr);
        tx.setPaymentId(utr);
        tx.setGateway("UPI");
        String upiId = req.getUpiId() == null ? "" : req.getUpiId().trim();
        if (!upiId.isBlank()) {
            tx.setUpiId(upiId.length() > 120 ? upiId.substring(0, 120) : upiId);
        }
        paymentTransactionRepository.save(tx);

        logger.info("Payment {} for business {} is waiting for owner confirmation", tx.getReferenceCode(), businessId);
        return getSubscriptionDetails(businessId);
    }

    @Transactional(readOnly = true)
    public List<PendingPaymentDto> listPaymentsAwaitingConfirmation() {
        return paymentTransactionRepository.findDetailedByStatus("PENDING_REVIEW").stream()
                .map(PendingPaymentDto::fromEntity)
                .toList();
    }

    @Transactional
    public PendingPaymentDto confirmReceivedPayment(UUID paymentId) {
        PaymentTransaction tx = paymentTransactionRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        if (!"PENDING_REVIEW".equals(tx.getStatus())) {
            throw new BadRequestException("This payment is not waiting for confirmation");
        }

        tx.setStatus("SUCCESS");
        paymentTransactionRepository.save(tx);

        Subscription sub = getOrInitSubscription(tx.getBusiness().getId());
        sub.setPlan(tx.getPlan());
        sub.setStatus("ACTIVE");
        sub.setTrialStatus("CONVERTED");
        Instant start = Instant.now();
        sub.setCurrentPeriodStart(start);
        sub.setCurrentPeriodEnd(start.plus(30, ChronoUnit.DAYS));
        sub.setCancelAtPeriodEnd(false);
        subscriptionRepository.save(sub);

        logger.info("Owner confirmed payment {} and activated {} for {}", tx.getReferenceCode(), tx.getPlan().getName(), tx.getBusiness().getName());
        return PendingPaymentDto.fromEntity(tx);
    }

    @Transactional
    public PendingPaymentDto rejectPayment(UUID paymentId) {
        PaymentTransaction tx = paymentTransactionRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        if (!"PENDING_REVIEW".equals(tx.getStatus())) {
            throw new BadRequestException("This payment is not waiting for confirmation");
        }
        tx.setStatus("REJECTED");
        paymentTransactionRepository.save(tx);
        logger.info("Owner rejected payment {} for {}", tx.getReferenceCode(), tx.getBusiness().getName());
        return PendingPaymentDto.fromEntity(tx);
    }

    @Transactional
    public void cancelSubscription(UUID businessId) {
        Subscription sub = getOrInitSubscription(businessId);
        sub.setCancelAtPeriodEnd(true);
        subscriptionRepository.save(sub);
    }

    public boolean canInitiateConversation(UUID businessId) {
        Subscription sub = getOrInitSubscription(businessId);
        if (!"ACTIVE".equalsIgnoreCase(sub.getStatus())) return false;

        long currentCount = conversationRepository.countByBusinessIdAndCreatedAtBetween(
                businessId, sub.getCurrentPeriodStart(), sub.getCurrentPeriodEnd());
        return currentCount < sub.getPlan().getMaxConversationsMonthly();
    }

    private BigDecimal amountWithGst(BigDecimal price) {
        BigDecimal base = price == null ? BigDecimal.ZERO : price;
        return base.multiply(new BigDecimal("1.18")).setScale(0, RoundingMode.HALF_UP);
    }

    private String newReferenceCode() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (int attempt = 0; attempt < 8; attempt++) {
            StringBuilder code = new StringBuilder("SR-");
            ThreadLocalRandom random = ThreadLocalRandom.current();
            for (int i = 0; i < 4; i++) {
                code.append(alphabet.charAt(random.nextInt(alphabet.length())));
            }
            if (paymentTransactionRepository.findByReferenceCode(code.toString()).isEmpty()) {
                return code.toString();
            }
        }
        throw new BadRequestException("Could not create a payment code. Try again.");
    }

    private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature, String secret) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String calculated = HexFormat.of().formatHex(hash);
            return calculated.equalsIgnoreCase(signature);
        } catch (Exception e) {
            logger.error("Error verifying Razorpay signature", e);
            return false;
        }
    }
}
