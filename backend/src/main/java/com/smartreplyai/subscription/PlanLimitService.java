package com.smartreplyai.subscription;

import com.smartreplyai.appointment.AppointmentRepository;
import com.smartreplyai.assistant.AiAssistantDailyUsage;
import com.smartreplyai.assistant.AiAssistantDailyUsageRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.staff.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlanLimitService {

    public static final ZoneId ASIA_KOLKATA = ZoneId.of("Asia/Kolkata");

    private final SubscriptionRepository subscriptionRepository;
    private final BusinessMemberRepository businessMemberRepository;
    private final StaffRepository staffRepository;
    private final CustomerRepository customerRepository;
    private final KnowledgeArticleRepository articleRepository;
    private final AppointmentRepository appointmentRepository;
    private final AiAssistantDailyUsageRepository aiAssistantDailyUsageRepository;
    private final ConversationRepository conversationRepository;
    private final BusinessRepository businessRepository;

    public PlanLimitService(SubscriptionRepository subscriptionRepository,
                            BusinessMemberRepository businessMemberRepository,
                            StaffRepository staffRepository,
                            CustomerRepository customerRepository,
                            KnowledgeArticleRepository articleRepository,
                            AppointmentRepository appointmentRepository,
                            AiAssistantDailyUsageRepository aiAssistantDailyUsageRepository,
                            ConversationRepository conversationRepository,
                            BusinessRepository businessRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.businessMemberRepository = businessMemberRepository;
        this.staffRepository = staffRepository;
        this.customerRepository = customerRepository;
        this.articleRepository = articleRepository;
        this.appointmentRepository = appointmentRepository;
        this.aiAssistantDailyUsageRepository = aiAssistantDailyUsageRepository;
        this.conversationRepository = conversationRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional
    public Subscription getSubscriptionWithLock(UUID businessId) {
        Subscription sub = subscriptionRepository.findByBusinessIdForUpdate(businessId)
                .orElseThrow(() -> new BadRequestException("No active subscription found for business."));
        if (sub.getPlan() == null) {
            throw new BadRequestException("No active subscription plan found. Please select or upgrade a plan.");
        }
        return sub;
    }

    public void checkTrialNotExpired(Subscription sub) {
        if (sub.isTrialExpired()) {
            throw new BadRequestException("Your free trial has ended. Please upgrade your plan to continue using premium features.");
        }
    }

    @Transactional
    public void checkStaffLimit(UUID businessId) {
        Subscription sub = getSubscriptionWithLock(businessId);
        checkTrialNotExpired(sub);

        PlanLimits.LimitConfig config = PlanLimits.forPlan(sub.getPlan().getCode());
        int maxStaff = config != null ? config.maxStaff() : 2;
        boolean isTrialOrFree = sub.isTrial()
                || "TRIAL".equalsIgnoreCase(sub.getPlan().getCode())
                || "FREE".equalsIgnoreCase(sub.getPlan().getCode())
                || "TRIALING".equalsIgnoreCase(sub.getStatus());

        if (isTrialOrFree) {
            maxStaff = 2;
        }

        long currentStaffCount = getCurrentStaffCount(businessId);

        if (currentStaffCount >= maxStaff) {
            if (isTrialOrFree) {
                throw new BadRequestException("Free Trial allows a maximum of 2 staff members. Upgrade your plan to add more staff.");
            } else {
                throw new BadRequestException(sub.getPlan().getName() + " allows a maximum of " + maxStaff + " staff members. Upgrade your plan to add more staff.");
            }
        }
    }

    @Transactional(readOnly = true)
    public long getCurrentStaffCount(UUID businessId) {
        List<BusinessMember> members = businessMemberRepository.findByBusinessIdWithUser(businessId);
        if (members == null || members.isEmpty()) {
            List<BusinessMember> fallback = businessMemberRepository.findByBusinessId(businessId);
            if (fallback != null && !fallback.isEmpty()) {
                members = fallback;
            }
        }

        Set<UUID> ownerUserIds = members.stream()
                .filter(m -> "OWNER".equalsIgnoreCase(m.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(m.getRole()))
                .map(m -> m.getUser() != null ? m.getUser().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> ownerEmails = members.stream()
                .filter(m -> "OWNER".equalsIgnoreCase(m.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(m.getRole()))
                .map(m -> m.getUser() != null ? m.getUser().getEmail() : null)
                .filter(Objects::nonNull)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Set<String> countedEmails = new HashSet<>();
        long nonOwnerMembers = 0;
        for (BusinessMember m : members) {
            if ("OWNER".equalsIgnoreCase(m.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(m.getRole())) {
                continue;
            }
            nonOwnerMembers++;
            if (m.getUser() != null && m.getUser().getEmail() != null) {
                countedEmails.add(m.getUser().getEmail().toLowerCase());
            }
        }

        List<Staff> staffList = staffRepository.findByBusinessId(businessId);
        long extraStaff = 0;
        for (Staff s : staffList) {
            if (!s.isActive()) continue;
            if (s.getUser() != null && ownerUserIds.contains(s.getUser().getId())) {
                continue;
            }
            if (s.getEmail() != null && ownerEmails.contains(s.getEmail().toLowerCase())) {
                continue;
            }
            if (s.getEmail() != null && countedEmails.contains(s.getEmail().toLowerCase())) {
                continue;
            }
            if (s.getEmail() != null) {
                countedEmails.add(s.getEmail().toLowerCase());
            }
            extraStaff++;
        }

        return nonOwnerMembers + extraStaff;
    }

    @Transactional
    public void checkCustomerLimit(UUID businessId) {
        Subscription sub = getSubscriptionWithLock(businessId);
        checkTrialNotExpired(sub);

        if (sub.isTrial()) {
            long count = customerRepository.countByBusinessId(businessId);
            if (count >= 5) {
                throw new BadRequestException("Free Trial allows a maximum of 5 customers. Upgrade your plan to add more customers.");
            }
        }
    }

    @Transactional
    public void checkKnowledgeArticleLimit(UUID businessId, String rawType) {
        Subscription sub = getSubscriptionWithLock(businessId);
        checkTrialNotExpired(sub);

        if (sub.isTrial()) {
            String type = normalizeArticleType(rawType);
            if ("KNOWLEDGE".equalsIgnoreCase(type)) {
                long count = articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "KNOWLEDGE");
                if (count >= 2) {
                    throw new BadRequestException("Free Trial allows a maximum of 2 Knowledge Base entries. Upgrade your plan to add more.");
                }
            } else {
                long count = articleRepository.countByBusinessIdAndTypeIgnoreCase(businessId, "FAQ");
                if (count >= 2) {
                    throw new BadRequestException("Free Trial allows a maximum of 2 FAQ entries. Upgrade your plan to add more.");
                }
            }
        }
    }

    @Transactional
    public void checkAppointmentLimit(UUID businessId) {
        Subscription sub = getSubscriptionWithLock(businessId);
        checkTrialNotExpired(sub);

        if (sub.isTrial()) {
            LocalDate today = LocalDate.now(ASIA_KOLKATA);
            Instant startOfDay = today.atStartOfDay(ASIA_KOLKATA).toInstant();
            Instant endOfDay = today.plusDays(1).atStartOfDay(ASIA_KOLKATA).toInstant().minusNanos(1);

            long dailyCount = appointmentRepository.countByBusinessIdAndCreatedAtBetween(businessId, startOfDay, endOfDay);
            if (dailyCount >= 2) {
                throw new BadRequestException("You have reached your daily appointment limit of 2.");
            }

            Instant trialStart = sub.getTrialStartedAt() != null ? sub.getTrialStartedAt() : sub.getCreatedAt();
            long totalCount = appointmentRepository.countByBusinessIdAndCreatedAtGreaterThanEqual(businessId, trialStart);
            if (totalCount >= 15) {
                throw new BadRequestException("You have reached the total trial appointment limit of 15. Please upgrade your plan to continue.");
            }
        }
    }

    @Transactional
    public void checkAiAssistantLimit(UUID businessId) {
        Subscription sub = getSubscriptionWithLock(businessId);
        checkTrialNotExpired(sub);

        String planCode = sub.getPlan().getCode();
        if ("STARTER".equalsIgnoreCase(planCode)) {
            throw new BadRequestException("AI Assistant is not included in the Starter plan. Upgrade your plan to use it.");
        }

        if (sub.isTrial()) {
            LocalDate today = LocalDate.now(ASIA_KOLKATA);
            int todayChats = getTodayAiChats(businessId, today);
            if (todayChats >= 10) {
                throw new BadRequestException("You have reached your daily AI Assistant conversation limit of 10. Upgrade your plan for more conversations.");
            }
        }
    }

    @Transactional
    public void incrementAiAssistantUsage(UUID businessId) {
        LocalDate today = LocalDate.now(ASIA_KOLKATA);
        AiAssistantDailyUsage usage = aiAssistantDailyUsageRepository.findByBusinessIdAndUsageDate(businessId, today)
                .orElseGet(() -> {
                    Business business = businessRepository.findById(businessId)
                            .orElseThrow(() -> new BadRequestException("Business not found"));
                    return new AiAssistantDailyUsage(business, today, 0);
                });
        usage.setChatCount(usage.getChatCount() + 1);
        aiAssistantDailyUsageRepository.save(usage);
    }

    public int getTodayAiChats(UUID businessId, LocalDate date) {
        return aiAssistantDailyUsageRepository.findByBusinessIdAndUsageDate(businessId, date)
                .map(AiAssistantDailyUsage::getChatCount)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public boolean isBusinessActive(UUID businessId) {
        return businessRepository.findById(businessId).map(Business::isActive).orElse(false);
    }

    @Transactional(readOnly = true)
    public void ensureBusinessActive(UUID businessId) {
        if (!isBusinessActive(businessId)) {
            throw new BadRequestException(
                    "This business account has been suspended. Please contact support.");
        }
    }

    @Transactional(readOnly = true)
    public boolean canSendWhatsAppAutoReply(UUID businessId) {
        if (!isBusinessActive(businessId)) {
            return false;
        }
        Subscription sub = subscriptionRepository.findByBusinessId(businessId).orElse(null);
        if (sub == null) {
            return false;
        }
        if (sub.isTrialExpired()) {
            return false;
        }
        return sub.getPlan() != null && sub.getPlan().isAiFeaturesEnabled();
    }

    @Transactional
    public void checkConversationLimit(UUID businessId) {
        Subscription sub = getSubscriptionWithLock(businessId);
        checkTrialNotExpired(sub);

        // Trial has no monthly customer conversations limit
        if (!sub.isTrial()) {
            PlanLimits.LimitConfig config = PlanLimits.forPlan(sub.getPlan().getCode());
            if (config != null && config.maxConversationsMonthly() < Integer.MAX_VALUE) {
                long currentMonth = conversationRepository.countByBusinessIdAndCreatedAtBetween(
                        businessId, sub.getCurrentPeriodStart(), sub.getCurrentPeriodEnd());
                if (currentMonth >= config.maxConversationsMonthly()) {
                    throw new BadRequestException(sub.getPlan().getName() + " limit reached: maximum " +
                            config.maxConversationsMonthly() + " conversations per month allowed. Please upgrade your subscription to continue.");
                }
            }
        }
    }

    public String normalizeArticleType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return "FAQ";
        }
        String clean = rawType.trim().toUpperCase();
        if (clean.contains("KNOWLEDGE") || clean.contains("KB")) {
            return "KNOWLEDGE";
        }
        return "FAQ";
    }
}
