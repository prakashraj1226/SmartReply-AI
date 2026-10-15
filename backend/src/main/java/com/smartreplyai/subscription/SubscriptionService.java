package com.smartreplyai.subscription;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.subscription.dto.CheckoutOrderDto;
import com.smartreplyai.subscription.dto.PaymentTransactionDto;
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
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BusinessRepository businessRepository;
    private final ConversationRepository conversationRepository;

    @Value("${app.razorpay.key-id:rzp_test_mock_key}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:rzp_test_mock_secret}")
    private String razorpayKeySecret;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               SubscriptionPlanRepository planRepository,
                               PaymentTransactionRepository paymentTransactionRepository,
                               BusinessRepository businessRepository,
                               ConversationRepository conversationRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.businessRepository = businessRepository;
        this.conversationRepository = conversationRepository;
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
                    SubscriptionPlan freePlan = planRepository.findByCode("FREE")
                            .orElseGet(() -> planRepository.findAll().stream().findFirst()
                                    .orElseThrow(() -> new ResourceNotFoundException("Default plan not found")));

                    Instant start = Instant.now();
                    Instant end = start.plus(30, ChronoUnit.DAYS);
                    Subscription sub = new Subscription(business, freePlan, start, end);
                    return subscriptionRepository.save(sub);
                });
    }

    @Transactional
    public SubscriptionDetailsDto getSubscriptionDetails(UUID businessId) {
        Subscription sub = getOrInitSubscription(businessId);
        SubscriptionPlan plan = sub.getPlan();

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

        return dto;
    }

    @Transactional
    public CheckoutOrderDto createCheckoutOrder(UUID businessId, String planCode) {
        SubscriptionPlan plan = planRepository.findByCode(planCode.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + planCode));

        String orderId = "order_rzp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        boolean isSimulated = "rzp_test_mock_key".equals(razorpayKeyId);

        return new CheckoutOrderDto(orderId, plan.getCode(), plan.getPriceInr(), razorpayKeyId, isSimulated);
    }

    @Transactional
    public SubscriptionDetailsDto verifyAndActivateSubscription(UUID businessId, VerifyPaymentRequest req) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        SubscriptionPlan plan = planRepository.findByCode(req.getPlanCode().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + req.getPlanCode()));

        String method = req.getPaymentMethod() == null ? "" : req.getPaymentMethod().trim().toUpperCase();
        boolean collectedPayment = "UPI".equals(method) || "CARD".equals(method) || "CASH".equals(method);
        boolean isSimulated = collectedPayment
                || Boolean.TRUE.equals(req.getIsSimulated())
                || "rzp_test_mock_key".equals(razorpayKeyId);

        if (!isSimulated && req.getSignature() != null && !req.getSignature().isBlank()) {
            boolean valid = verifyRazorpaySignature(req.getOrderId(), req.getPaymentId(), req.getSignature(), razorpayKeySecret);
            if (!valid) {
                throw new BadRequestException("Invalid payment signature verification");
            }
        }

        BigDecimal amount = plan.getPriceInr() == null ? BigDecimal.ZERO : plan.getPriceInr();
        if (collectedPayment) {
            amount = amount.multiply(new BigDecimal("1.18")).setScale(0, java.math.RoundingMode.HALF_UP);
        }

        PaymentTransaction tx = new PaymentTransaction(
                business,
                plan,
                collectedPayment ? method : (isSimulated ? "SIMULATED" : "RAZORPAY"),
                req.getOrderId(),
                req.getPaymentId(),
                req.getSignature(),
                amount,
                "SUCCESS"
        );
        paymentTransactionRepository.save(tx);

        // Activate / Upgrade Subscription
        Subscription sub = getOrInitSubscription(businessId);
        sub.setPlan(plan);
        sub.setStatus("ACTIVE");
        sub.setCurrentPeriodStart(Instant.now());
        sub.setCurrentPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
        sub.setCancelAtPeriodEnd(false);
        subscriptionRepository.save(sub);

        logger.info("Activated subscription {} for business {} on plan {}", sub.getId(), business.getName(), plan.getName());
        return getSubscriptionDetails(businessId);
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
