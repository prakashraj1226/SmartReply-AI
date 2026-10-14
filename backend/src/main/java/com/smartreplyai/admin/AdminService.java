package com.smartreplyai.admin;

import com.smartreplyai.admin.dto.AdminBusinessDto;
import com.smartreplyai.admin.dto.AdminOverviewDto;
import com.smartreplyai.admin.dto.AdminUserDto;
import com.smartreplyai.admin.dto.AuditLogDto;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.subscription.Subscription;
import com.smartreplyai.subscription.SubscriptionRepository;
import com.smartreplyai.whatsapp.IntegrationAccount;
import com.smartreplyai.whatsapp.IntegrationAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final BusinessMemberRepository businessMemberRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final IntegrationAccountRepository integrationAccountRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final com.smartreplyai.appointment.AppointmentRepository appointmentRepository;

    public AdminService(BusinessRepository businessRepository,
                        UserRepository userRepository,
                        BusinessMemberRepository businessMemberRepository,
                        ConversationRepository conversationRepository,
                        MessageRepository messageRepository,
                        SubscriptionRepository subscriptionRepository,
                        IntegrationAccountRepository integrationAccountRepository,
                        AuditLogRepository auditLogRepository,
                        AuditLogService auditLogService,
                        com.smartreplyai.appointment.AppointmentRepository appointmentRepository) {
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.businessMemberRepository = businessMemberRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.integrationAccountRepository = integrationAccountRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public AdminOverviewDto getPlatformOverview() {
        List<Business> allBusinesses = businessRepository.findAll();
        long totalBusinesses = allBusinesses.size();
        long activeBusinesses = allBusinesses.stream().filter(Business::isActive).count();
        long totalUsers = userRepository.count();
        long totalConversations = conversationRepository.count();
        long totalMessages = messageRepository.count();

        // Calculate MRR from active subscriptions
        List<Subscription> subscriptions = subscriptionRepository.findAll();
        BigDecimal estimatedMrrInr = subscriptions.stream()
                .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()) && s.getPlan() != null)
                .map(s -> s.getPlan().getPriceInr())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeIntegrations = integrationAccountRepository.count();
        long totalAppointments = appointmentRepository.count();
        long completedAppointments = appointmentRepository.countByStatus("COMPLETED");

        Map<String, Long> businessesByIndustry = allBusinesses.stream()
                .collect(Collectors.groupingBy(
                        b -> (b.getCategory() != null && !b.getCategory().isBlank()) ? b.getCategory() : "General",
                        Collectors.counting()
                ));

        AdminOverviewDto overview = new AdminOverviewDto(
                totalBusinesses,
                activeBusinesses,
                totalUsers,
                totalConversations,
                totalMessages,
                estimatedMrrInr,
                activeIntegrations
        );
        overview.setTotalAppointments(totalAppointments);
        overview.setCompletedAppointments(completedAppointments);
        overview.setBusinessesByIndustry(businessesByIndustry);

        return overview;
    }

    @Transactional(readOnly = true)
    public List<AdminBusinessDto> getAllBusinesses() {
        List<Business> businesses = businessRepository.findAll();
        List<Subscription> subscriptions = subscriptionRepository.findAll();
        Map<UUID, String> businessPlanMap = subscriptions.stream()
                .filter(s -> s.getBusiness() != null && s.getPlan() != null)
                .collect(Collectors.toMap(s -> s.getBusiness().getId(), s -> s.getPlan().getName(), (a, b) -> a));

        List<BusinessMember> allMembers = businessMemberRepository.findAll();
        Map<UUID, Long> memberCountMap = allMembers.stream()
                .collect(Collectors.groupingBy(m -> m.getBusiness().getId(), Collectors.counting()));

        List<AdminBusinessDto> dtos = new ArrayList<>();
        for (Business b : businesses) {
            AdminBusinessDto dto = new AdminBusinessDto();
            dto.setId(b.getId());
            dto.setName(b.getName());
            dto.setSlug(b.getSlug());
            dto.setCategory(b.getCategory());
            dto.setEmail(b.getEmail());
            dto.setPhone(b.getPhone());
            dto.setActive(b.isActive());
            dto.setOnboardingCompleted(b.isOnboardingCompleted());
            dto.setPlanName(businessPlanMap.getOrDefault(b.getId(), "Free Plan"));
            dto.setMemberCount(memberCountMap.getOrDefault(b.getId(), 1L));
            dto.setCreatedAt(b.getCreatedAt());
            dtos.add(dto);
        }
        return dtos;
    }

    @Transactional
    public AdminBusinessDto updateBusinessStatus(UUID businessId, boolean isActive, User adminUser, String ipAddress) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new IllegalArgumentException("Business not found: " + businessId));

        business.setActive(isActive);
        Business saved = businessRepository.save(business);

        auditLogService.logAction(
                saved,
                adminUser,
                isActive ? "BUSINESS_ACTIVATED" : "BUSINESS_SUSPENDED",
                "BUSINESS",
                saved.getId().toString(),
                "{\"active\":" + isActive + "}",
                ipAddress
        );

        AdminBusinessDto dto = new AdminBusinessDto();
        dto.setId(saved.getId());
        dto.setName(saved.getName());
        dto.setSlug(saved.getSlug());
        dto.setCategory(saved.getCategory());
        dto.setEmail(saved.getEmail());
        dto.setPhone(saved.getPhone());
        dto.setActive(saved.isActive());
        dto.setOnboardingCompleted(saved.isOnboardingCompleted());
        dto.setCreatedAt(saved.getCreatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<BusinessMember> allMembers = businessMemberRepository.findAll();
        Map<UUID, String> userBusinessMap = allMembers.stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), m -> m.getBusiness().getName(), (a, b) -> a));

        List<AdminUserDto> dtos = new ArrayList<>();
        for (User u : users) {
            AdminUserDto dto = new AdminUserDto();
            dto.setId(u.getId());
            dto.setFullName(u.getFullName());
            dto.setEmail(u.getEmail());
            dto.setRole(u.getRole());
            dto.setActive(u.isActive());
            dto.setEmailVerified(u.isEmailVerified());
            dto.setBusinessName(userBusinessMap.getOrDefault(u.getId(), "Platform Admin / Independent"));
            dto.setCreatedAt(u.getCreatedAt());
            dtos.add(dto);
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findTop100ByOrderByCreatedAtDesc();
        List<AuditLogDto> dtos = new ArrayList<>();
        for (AuditLog l : logs) {
            AuditLogDto dto = new AuditLogDto();
            dto.setId(l.getId());
            dto.setBusinessName(l.getBusiness() != null ? l.getBusiness().getName() : "System");
            dto.setUserEmail(l.getUser() != null ? l.getUser().getEmail() : "system");
            dto.setAction(l.getAction());
            dto.setEntityType(l.getEntityType());
            dto.setEntityId(l.getEntityId());
            dto.setDetailsJson(l.getDetailsJson());
            dto.setIpAddress(l.getIpAddress());
            dto.setCreatedAt(l.getCreatedAt());
            dtos.add(dto);
        }
        return dtos;
    }
}
