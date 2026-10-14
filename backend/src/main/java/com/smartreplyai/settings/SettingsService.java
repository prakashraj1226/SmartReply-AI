package com.smartreplyai.settings;

import com.smartreplyai.admin.AuditLogService;
import com.smartreplyai.ai.AiConfiguration;
import com.smartreplyai.ai.AiConfigurationRepository;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.settings.dto.*;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.staff.StaffRepository;
import com.smartreplyai.subscription.Subscription;
import com.smartreplyai.subscription.SubscriptionService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SettingsService {

    private final BusinessRepository businessRepository;
    private final AiConfigurationRepository aiConfigurationRepository;
    private final BusinessMemberRepository businessMemberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionService subscriptionService;
    private final AuditLogService auditLogService;
    private final StaffRepository staffRepository;

    public SettingsService(BusinessRepository businessRepository,
                           AiConfigurationRepository aiConfigurationRepository,
                           BusinessMemberRepository businessMemberRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           SubscriptionService subscriptionService,
                           AuditLogService auditLogService,
                           StaffRepository staffRepository) {
        this.businessRepository = businessRepository;
        this.aiConfigurationRepository = aiConfigurationRepository;
        this.businessMemberRepository = businessMemberRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.subscriptionService = subscriptionService;
        this.auditLogService = auditLogService;
        this.staffRepository = staffRepository;
    }

    @Transactional(readOnly = true)
    public BusinessProfileDto getBusinessProfile(UUID businessId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        BusinessProfileDto dto = new BusinessProfileDto();
        dto.setId(business.getId());
        dto.setName(business.getName());
        dto.setCategory(business.getCategory());
        dto.setEmail(business.getEmail());
        dto.setPhone(business.getPhone());
        dto.setAddress(business.getAddress());
        dto.setTimezone(business.getTimezone());
        dto.setOperatingHoursJson(business.getOperatingHoursJson());
        dto.setPreferredLanguage(business.getPreferredLanguage());
        dto.setDescription(business.getDescription());
        return dto;
    }

    @Transactional
    public BusinessProfileDto updateBusinessProfile(UUID businessId, BusinessProfileDto dto, User currentUser, String ipAddress) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        business.setName(dto.getName());
        business.setCategory(dto.getCategory());
        business.setEmail(dto.getEmail());
        business.setPhone(dto.getPhone());
        business.setAddress(dto.getAddress());
        if (dto.getTimezone() != null && !dto.getTimezone().isBlank()) {
            business.setTimezone(dto.getTimezone());
        }
        business.setOperatingHoursJson(dto.getOperatingHoursJson());
        if (dto.getPreferredLanguage() != null && !dto.getPreferredLanguage().isBlank()) {
            business.setPreferredLanguage(dto.getPreferredLanguage());
        }
        business.setDescription(dto.getDescription());

        Business saved = businessRepository.save(business);

        auditLogService.logAction(
                saved,
                currentUser,
                "BUSINESS_PROFILE_UPDATED",
                "BUSINESS",
                saved.getId().toString(),
                "{\"name\":\"" + saved.getName() + "\"}",
                ipAddress
        );

        return getBusinessProfile(saved.getId());
    }

    @Transactional
    public AiConfigDto getAiConfiguration(UUID businessId) {
        AiConfiguration config = aiConfigurationRepository.findByBusinessId(businessId)
                .orElseGet(() -> {
                    Business business = businessRepository.findById(businessId)
                            .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
                    AiConfiguration newConfig = new AiConfiguration(business);
                    return aiConfigurationRepository.save(newConfig);
                });

        AiConfigDto dto = new AiConfigDto();
        dto.setId(config.getId());
        dto.setAssistantName(config.getAssistantName());
        dto.setTone(config.getTone());
        dto.setGreetingMessage(config.getGreetingMessage());
        dto.setFallbackMessage(config.getFallbackMessage());
        dto.setConfidenceThreshold(config.getConfidenceThreshold());
        dto.setEnabled(config.isEnabled());
        dto.setMaxResponseTokens(config.getMaxResponseTokens());
        return dto;
    }

    @Transactional
    public AiConfigDto updateAiConfiguration(UUID businessId, AiConfigDto dto, User currentUser, String ipAddress) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        AiConfiguration config = aiConfigurationRepository.findByBusinessId(businessId)
                .orElseGet(() -> new AiConfiguration(business));

        config.setAssistantName(dto.getAssistantName());
        config.setTone(dto.getTone());
        config.setGreetingMessage(dto.getGreetingMessage());
        config.setFallbackMessage(dto.getFallbackMessage());
        if (dto.getConfidenceThreshold() != null) {
            config.setConfidenceThreshold(dto.getConfidenceThreshold());
        }
        config.setEnabled(dto.isEnabled());
        if (dto.getMaxResponseTokens() > 0) {
            config.setMaxResponseTokens(dto.getMaxResponseTokens());
        }

        AiConfiguration saved = aiConfigurationRepository.save(config);

        auditLogService.logAction(
                business,
                currentUser,
                "AI_CONFIG_UPDATED",
                "AI_CONFIGURATION",
                saved.getId() != null ? saved.getId().toString() : business.getId().toString(),
                "{\"assistantName\":\"" + saved.getAssistantName() + "\",\"enabled\":" + saved.isEnabled() + "}",
                ipAddress
        );

        return getAiConfiguration(businessId);
    }

    @Transactional(readOnly = true)
    public List<TeamMemberDto> getTeamMembers(UUID businessId) {
        List<BusinessMember> members = businessMemberRepository.findByBusinessId(businessId);
        return members.stream().map(m -> new TeamMemberDto(
                m.getId(),
                m.getUser().getId(),
                m.getUser().getFullName(),
                m.getUser().getEmail(),
                m.getRole(),
                m.getMembershipStatus() != null ? m.getMembershipStatus() : "ACTIVE",
                m.getJoinedAt() != null ? m.getJoinedAt() : m.getCreatedAt()
        )).collect(Collectors.toList());
    }

    @Transactional
    public TeamMemberDto inviteTeamMember(UUID businessId, InviteMemberRequest req, User currentUser, String ipAddress) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        // Check subscription agent limit (counting non-owner invited agents)
        Subscription sub = subscriptionService.getOrInitSubscription(businessId);
        int maxAgents = sub.getPlan() != null ? sub.getPlan().getMaxAgents() : 5;
        List<BusinessMember> currentMembers = businessMemberRepository.findByBusinessId(businessId);
        long currentAgentCount = currentMembers.stream()
                .filter(m -> !"OWNER".equalsIgnoreCase(m.getRole()) && !"BUSINESS_OWNER".equalsIgnoreCase(m.getRole()))
                .count();
        if (currentAgentCount >= maxAgents) {
            String planName = (sub.getPlan() != null && sub.getPlan().getName() != null) ? sub.getPlan().getName() : "Current Plan";
            throw new BadRequestException("Current plan (" + planName + ") limit reached: maximum " +
                    maxAgents + " invited staff agent(s) allowed. Please upgrade your subscription to add more members.");
        }

        String rawRole = req.getRole() != null ? req.getRole().trim().toUpperCase() : "AGENT";
        if (rawRole.contains("OWNER")) {
            throw new BadRequestException("Cannot assign Owner role via invitation. Primary ownership is non-transferable.");
        }

        String normalizedRole = switch (rawRole) {
            case "ADMIN", "BUSINESS_ADMIN" -> "BUSINESS_ADMIN";
            case "MANAGER" -> "MANAGER";
            case "RECEPTIONIST" -> "RECEPTIONIST";
            case "DOCTOR" -> "DOCTOR";
            case "DENTIST" -> "DENTIST";
            case "SALON_STAFF", "STYLIST", "BEAUTICIAN" -> "SALON_STAFF";
            default -> "AGENT";
        };

        String email = req.getEmail().trim().toLowerCase();
        User targetUser = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User(
                    email,
                    passwordEncoder.encode("Welcome@" + UUID.randomUUID().toString().substring(0, 8)),
                    req.getFullName().trim(),
                    "BUSINESS_AGENT"
            );
            return userRepository.save(newUser);
        });

        if (businessMemberRepository.existsByBusinessIdAndUserId(businessId, targetUser.getId())) {
            throw new BadRequestException("User " + email + " is already a team member of this business");
        }

        BusinessMember member = new BusinessMember(business, targetUser, normalizedRole);
        member.setMembershipStatus("ACTIVE");
        BusinessMember saved = businessMemberRepository.save(member);

        // Synchronize with Staff entity if not already present
        if (!staffRepository.existsByBusinessIdAndUserId(businessId, targetUser.getId()) &&
            !staffRepository.existsByBusinessIdAndEmail(businessId, email)) {
            Staff staff = new Staff(business, null, req.getFullName().trim(), normalizedRole, null, email);
            staff.setUser(targetUser);
            staff.setActive(true);
            staffRepository.save(staff);
        }

        auditLogService.logAction(
                business,
                currentUser,
                "TEAM_MEMBER_ADDED",
                "BUSINESS_MEMBER",
                saved.getId().toString(),
                "{\"email\":\"" + email + "\",\"role\":\"" + normalizedRole + "\"}",
                ipAddress
        );

        return new TeamMemberDto(
                saved.getId(),
                targetUser.getId(),
                targetUser.getFullName(),
                targetUser.getEmail(),
                saved.getRole(),
                saved.getMembershipStatus(),
                saved.getJoinedAt() != null ? saved.getJoinedAt() : saved.getCreatedAt()
        );
    }

    @Transactional
    public TeamMemberDto updateTeamMemberRole(UUID businessId, UUID memberId, UpdateMemberRoleRequest req, User currentUser, String ipAddress) {
        BusinessMember member = businessMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));

        if (!member.getBusiness().getId().equals(businessId)) {
            throw new BadRequestException("Member does not belong to this business");
        }

        if ("OWNER".equalsIgnoreCase(member.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(member.getRole())) {
            throw new BadRequestException("Primary business owner role cannot be changed");
        }

        String rawRole = req.getRole() != null ? req.getRole().trim().toUpperCase() : "AGENT";
        if (rawRole.contains("OWNER")) {
            throw new BadRequestException("Cannot escalate role to Owner");
        }

        String normalizedRole = switch (rawRole) {
            case "ADMIN", "BUSINESS_ADMIN" -> "BUSINESS_ADMIN";
            case "MANAGER" -> "MANAGER";
            case "RECEPTIONIST" -> "RECEPTIONIST";
            case "DOCTOR" -> "DOCTOR";
            case "DENTIST" -> "DENTIST";
            case "SALON_STAFF", "STYLIST", "BEAUTICIAN" -> "SALON_STAFF";
            default -> "AGENT";
        };

        member.setRole(normalizedRole);
        BusinessMember saved = businessMemberRepository.save(member);

        // Synchronize with Staff entity
        staffRepository.findByBusinessIdAndUserId(businessId, member.getUser().getId())
                .ifPresent(s -> {
                    s.setStaffType(normalizedRole);
                    staffRepository.save(s);
                });

        auditLogService.logAction(
                member.getBusiness(),
                currentUser,
                "TEAM_MEMBER_ROLE_UPDATED",
                "BUSINESS_MEMBER",
                saved.getId().toString(),
                "{\"newRole\":\"" + normalizedRole + "\"}",
                ipAddress
        );

        return new TeamMemberDto(
                saved.getId(),
                saved.getUser().getId(),
                saved.getUser().getFullName(),
                saved.getUser().getEmail(),
                saved.getRole(),
                saved.getMembershipStatus(),
                saved.getJoinedAt() != null ? saved.getJoinedAt() : saved.getCreatedAt()
        );
    }

    @Transactional
    public TeamMemberDto updateTeamMemberStatus(UUID businessId, UUID memberId, UpdateMemberStatusRequest req, User currentUser, String ipAddress) {
        BusinessMember member = businessMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));

        if (!member.getBusiness().getId().equals(businessId)) {
            throw new BadRequestException("Member does not belong to this business");
        }

        if ("OWNER".equalsIgnoreCase(member.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(member.getRole())) {
            throw new BadRequestException("Primary business owner cannot be suspended");
        }

        String status = "SUSPENDED".equalsIgnoreCase(req.getStatus()) ? "SUSPENDED" : "ACTIVE";
        member.setMembershipStatus(status);
        BusinessMember saved = businessMemberRepository.save(member);

        // Synchronize with Staff entity
        staffRepository.findByBusinessIdAndUserId(businessId, member.getUser().getId())
                .ifPresent(s -> {
                    s.setActive("ACTIVE".equalsIgnoreCase(status));
                    staffRepository.save(s);
                });

        auditLogService.logAction(
                member.getBusiness(),
                currentUser,
                "TEAM_MEMBER_STATUS_UPDATED",
                "BUSINESS_MEMBER",
                saved.getId().toString(),
                "{\"status\":\"" + status + "\"}",
                ipAddress
        );

        return new TeamMemberDto(
                saved.getId(),
                saved.getUser().getId(),
                saved.getUser().getFullName(),
                saved.getUser().getEmail(),
                saved.getRole(),
                saved.getMembershipStatus(),
                saved.getJoinedAt() != null ? saved.getJoinedAt() : saved.getCreatedAt()
        );
    }

    @Transactional
    public void removeTeamMember(UUID businessId, UUID memberId, User currentUser, String ipAddress) {
        BusinessMember member = businessMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));

        if (!member.getBusiness().getId().equals(businessId)) {
            throw new BadRequestException("Member does not belong to this business");
        }

        if ("OWNER".equalsIgnoreCase(member.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(member.getRole())) {
            throw new BadRequestException("The primary business owner cannot be removed");
        }

        Business business = member.getBusiness();
        businessMemberRepository.delete(member);

        // Synchronize with Staff entity by deactivating matching staff
        staffRepository.findByBusinessIdAndUserId(businessId, member.getUser().getId())
                .ifPresent(s -> {
                    s.setActive(false);
                    staffRepository.save(s);
                });

        auditLogService.logAction(
                business,
                currentUser,
                "TEAM_MEMBER_REMOVED",
                "BUSINESS_MEMBER",
                memberId.toString(),
                "{\"memberEmail\":\"" + member.getUser().getEmail() + "\"}",
                ipAddress
        );
    }
}
