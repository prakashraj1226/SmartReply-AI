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

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
    private final com.smartreplyai.subscription.PlanLimitService planLimitService;

    public SettingsService(BusinessRepository businessRepository,
                           AiConfigurationRepository aiConfigurationRepository,
                           BusinessMemberRepository businessMemberRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           SubscriptionService subscriptionService,
                           AuditLogService auditLogService,
                           StaffRepository staffRepository,
                           com.smartreplyai.subscription.PlanLimitService planLimitService) {
        this.businessRepository = businessRepository;
        this.aiConfigurationRepository = aiConfigurationRepository;
        this.businessMemberRepository = businessMemberRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.subscriptionService = subscriptionService;
        this.auditLogService = auditLogService;
        this.staffRepository = staffRepository;
        this.planLimitService = planLimitService;
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
        List<BusinessMember> members = businessMemberRepository.findByBusinessIdWithUser(businessId);
        Set<String> seenEmails = new HashSet<>();
        List<TeamMemberDto> dtos = new ArrayList<>();

        for (BusinessMember m : members) {
            if (m.getUser() == null) continue;
            String email = m.getUser().getEmail() != null ? m.getUser().getEmail().toLowerCase() : "";
            if (!email.isBlank()) {
                seenEmails.add(email);
            }
            dtos.add(new TeamMemberDto(
                    m.getId(),
                    m.getUser().getId(),
                    m.getUser().getFullName() != null ? m.getUser().getFullName() : "Team Member",
                    m.getUser().getEmail(),
                    m.getUser().getPhone(),
                    m.getRole(),
                    m.getMembershipStatus() != null ? m.getMembershipStatus() : "ACTIVE",
                    m.getJoinedAt() != null ? m.getJoinedAt() : m.getCreatedAt()
            ));
        }

        if (staffRepository != null) {
            List<Staff> extraStaff = staffRepository.findByBusinessId(businessId);
            for (Staff s : extraStaff) {
                if (!s.isActive()) {
                    continue; // Skip deactivated or deleted staff members
                }
                String sEmail = s.getEmail() != null ? s.getEmail().toLowerCase() : "";
                if (!sEmail.isBlank() && seenEmails.contains(sEmail)) {
                    continue;
                }
                if (s.getUser() != null && s.getUser().getEmail() != null && seenEmails.contains(s.getUser().getEmail().toLowerCase())) {
                    continue;
                }
                if (!sEmail.isBlank()) {
                    seenEmails.add(sEmail);
                }
                dtos.add(new TeamMemberDto(
                        s.getId(),
                        s.getUser() != null ? s.getUser().getId() : s.getId(),
                        s.getName(),
                        s.getEmail() != null ? s.getEmail() : "",
                        s.getPhone() != null ? s.getPhone() : "",
                        s.getStaffType() != null ? s.getStaffType() : "STAFF",
                        s.isActive() ? "ACTIVE" : "INACTIVE",
                        s.getCreatedAt() != null ? s.getCreatedAt() : Instant.now()
                ));
            }
        }

        return dtos;
    }

    @Transactional
    public TeamMemberDto inviteTeamMember(UUID businessId, InviteMemberRequest req, User currentUser, String ipAddress) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        // Check subscription agent limit (counting non-owner invited agents)
        planLimitService.checkStaffLimit(businessId);

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
        String rawPhone = req.getPhone() != null && !req.getPhone().isBlank() ? req.getPhone().trim() : null;
        String rawPassword = req.getPassword() != null && !req.getPassword().isBlank() ? req.getPassword().trim() : "Staff@123";

        // Check if phone is already taken by another user
        if (rawPhone != null) {
            userRepository.findByPhone(rawPhone).ifPresent(existingUserWithPhone -> {
                if (!existingUserWithPhone.getEmail().equalsIgnoreCase(email)) {
                    throw new BadRequestException("Phone number " + rawPhone + " is already in use by another user account.");
                }
            });
        }

        User targetUser = userRepository.findByEmail(email).map(existingUser -> {
            if (rawPhone != null && (existingUser.getPhone() == null || existingUser.getPhone().isBlank())) {
                existingUser.setPhone(rawPhone);
            }
            if (req.getPassword() != null && !req.getPassword().isBlank()) {
                existingUser.setPassword(passwordEncoder.encode(rawPassword));
            }
            User saved = userRepository.save(existingUser);
            return saved != null ? saved : existingUser;
        }).orElseGet(() -> {
            User newUser = new User(
                    email,
                    passwordEncoder != null ? passwordEncoder.encode(rawPassword) : rawPassword,
                    req.getFullName().trim(),
                    "BUSINESS_AGENT"
            );
            newUser.setPhone(rawPhone);
            User saved = userRepository.save(newUser);
            return saved != null ? saved : newUser;
        });

        if (businessMemberRepository.existsByBusinessIdAndUserId(businessId, targetUser.getId())) {
            throw new BadRequestException("User " + email + " is already a team member of this business");
        }

        BusinessMember member = new BusinessMember(business, targetUser, normalizedRole);
        member.setMembershipStatus("ACTIVE");
        BusinessMember saved = businessMemberRepository.save(member);

        // Synchronize with Staff entity if not already present
        if (staffRepository != null &&
            !staffRepository.existsByBusinessIdAndUserId(businessId, targetUser.getId()) &&
            !staffRepository.existsByBusinessIdAndEmail(businessId, email)) {
            Staff staff = new Staff(business, null, req.getFullName().trim(), normalizedRole, rawPhone, email);
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
                targetUser.getPhone(),
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
        if (staffRepository != null) {
            staffRepository.findByBusinessIdAndUserId(businessId, member.getUser().getId())
                    .ifPresent(s -> {
                        s.setStaffType(normalizedRole);
                        staffRepository.save(s);
                    });
        }

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
                saved.getUser().getPhone(),
                saved.getRole(),
                saved.getMembershipStatus(),
                saved.getJoinedAt() != null ? saved.getJoinedAt() : saved.getCreatedAt()
        );
    }

    @Transactional
    public TeamMemberDto updateTeamMemberStatus(UUID businessId, UUID memberId, UpdateMemberStatusRequest req, User currentUser, String ipAddress) {
        String status = "SUSPENDED".equalsIgnoreCase(req.getStatus()) ? "SUSPENDED" : "ACTIVE";

        Optional<BusinessMember> memberOpt = businessMemberRepository.findById(memberId);
        if (memberOpt.isPresent()) {
            BusinessMember member = memberOpt.get();
            if (!member.getBusiness().getId().equals(businessId)) {
                throw new BadRequestException("Member does not belong to this business");
            }

            if ("OWNER".equalsIgnoreCase(member.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(member.getRole())) {
                throw new BadRequestException("Primary business owner cannot be suspended");
            }

            member.setMembershipStatus(status);
            BusinessMember saved = businessMemberRepository.save(member);

            // Synchronize with Staff entity
            if (staffRepository != null && member.getUser() != null) {
                staffRepository.findByBusinessIdAndUserId(businessId, member.getUser().getId())
                        .ifPresent(s -> {
                            s.setActive("ACTIVE".equalsIgnoreCase(status));
                            staffRepository.save(s);
                        });
            }

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
                    saved.getUser().getPhone(),
                    saved.getRole(),
                    saved.getMembershipStatus(),
                    saved.getJoinedAt() != null ? saved.getJoinedAt() : saved.getCreatedAt()
            );
        }

        if (staffRepository != null) {
            Optional<Staff> staffOpt = staffRepository.findById(memberId);
            if (staffOpt.isPresent()) {
                Staff s = staffOpt.get();
                if (!s.getBusiness().getId().equals(businessId)) {
                    throw new BadRequestException("Member does not belong to this business");
                }
                s.setActive("ACTIVE".equalsIgnoreCase(status));
                Staff savedStaff = staffRepository.save(s);
                return new TeamMemberDto(
                        savedStaff.getId(),
                        savedStaff.getUser() != null ? savedStaff.getUser().getId() : savedStaff.getId(),
                        savedStaff.getName(),
                        savedStaff.getEmail() != null ? savedStaff.getEmail() : "",
                        savedStaff.getPhone() != null ? savedStaff.getPhone() : "",
                        savedStaff.getStaffType() != null ? savedStaff.getStaffType() : "STAFF",
                        savedStaff.isActive() ? "ACTIVE" : "INACTIVE",
                        savedStaff.getCreatedAt() != null ? savedStaff.getCreatedAt() : Instant.now()
                );
            }
        }

        throw new ResourceNotFoundException("Team member not found");
    }

    @Transactional
    public TeamMemberDto updateTeamMember(UUID businessId, UUID memberId, UpdateTeamMemberRequest req, User currentUser, String ipAddress) {
        Optional<BusinessMember> memberOpt = businessMemberRepository.findById(memberId);
        if (memberOpt.isEmpty()) {
            if (staffRepository != null) {
                Optional<Staff> staffOpt = staffRepository.findById(memberId);
                if (staffOpt.isPresent()) {
                    Staff s = staffOpt.get();
                    if (!s.getBusiness().getId().equals(businessId)) {
                        throw new BadRequestException("Member does not belong to this business");
                    }
                    if (req.getFullName() != null && !req.getFullName().isBlank()) {
                        s.setName(req.getFullName().trim());
                    }
                    if (req.getPhone() != null) {
                        s.setPhone(req.getPhone().trim());
                    }
                    if (req.getRole() != null && !req.getRole().isBlank()) {
                        s.setStaffType(req.getRole().trim());
                    }
                    if (req.getStatus() != null && !req.getStatus().isBlank()) {
                        s.setActive("ACTIVE".equalsIgnoreCase(req.getStatus()));
                    }
                    Staff savedStaff = staffRepository.save(s);
                    return new TeamMemberDto(
                            savedStaff.getId(),
                            savedStaff.getUser() != null ? savedStaff.getUser().getId() : savedStaff.getId(),
                            savedStaff.getName(),
                            savedStaff.getEmail() != null ? savedStaff.getEmail() : "",
                            savedStaff.getPhone() != null ? savedStaff.getPhone() : "",
                            savedStaff.getStaffType() != null ? savedStaff.getStaffType() : "STAFF",
                            savedStaff.isActive() ? "ACTIVE" : "INACTIVE",
                            savedStaff.getCreatedAt() != null ? savedStaff.getCreatedAt() : Instant.now()
                    );
                }
            }
            throw new ResourceNotFoundException("Team member not found");
        }

        BusinessMember member = memberOpt.get();

        if (!member.getBusiness().getId().equals(businessId)) {
            throw new BadRequestException("Member does not belong to this business");
        }

        boolean isOwner = "OWNER".equalsIgnoreCase(member.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(member.getRole());
        User targetUser = member.getUser();

        // 1. Update Full Name
        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            targetUser.setFullName(req.getFullName().trim());
        }

        // 2. Update Phone Number
        if (req.getPhone() != null) {
            String trimmedPhone = req.getPhone().trim();
            if (trimmedPhone.isBlank()) {
                targetUser.setPhone(null);
            } else {
                userRepository.findByPhone(trimmedPhone).ifPresent(existingWithPhone -> {
                    if (!existingWithPhone.getId().equals(targetUser.getId())) {
                        throw new BadRequestException("Phone number " + trimmedPhone + " is already in use by another user account.");
                    }
                });
                targetUser.setPhone(trimmedPhone);
            }
        }

        // 3. Update Password if provided
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            if (req.getPassword().trim().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters long");
            }
            targetUser.setPassword(passwordEncoder != null ? passwordEncoder.encode(req.getPassword().trim()) : req.getPassword().trim());
        }

        userRepository.save(targetUser);

        // 4. Update Role (if not Owner)
        String normalizedRole = member.getRole();
        if (req.getRole() != null && !req.getRole().isBlank()) {
            String rawRole = req.getRole().trim().toUpperCase();
            if (isOwner && !rawRole.contains("OWNER")) {
                throw new BadRequestException("Primary business owner role cannot be changed");
            }
            if (!isOwner && rawRole.contains("OWNER")) {
                throw new BadRequestException("Cannot escalate role to Owner");
            }
            if (!isOwner) {
                normalizedRole = switch (rawRole) {
                    case "ADMIN", "BUSINESS_ADMIN" -> "BUSINESS_ADMIN";
                    case "MANAGER" -> "MANAGER";
                    case "RECEPTIONIST" -> "RECEPTIONIST";
                    case "DOCTOR" -> "DOCTOR";
                    case "DENTIST" -> "DENTIST";
                    case "SALON_STAFF", "STYLIST", "BEAUTICIAN" -> "SALON_STAFF";
                    default -> "AGENT";
                };
                member.setRole(normalizedRole);
            }
        }

        // 5. Update Status (if not Owner)
        String newStatus = member.getMembershipStatus();
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            if (isOwner && "SUSPENDED".equalsIgnoreCase(req.getStatus())) {
                throw new BadRequestException("Primary business owner cannot be suspended");
            }
            newStatus = "SUSPENDED".equalsIgnoreCase(req.getStatus()) ? "SUSPENDED" : "ACTIVE";
            member.setMembershipStatus(newStatus);
        }

        BusinessMember saved = businessMemberRepository.save(member);

        // Synchronize with Staff entity
        if (staffRepository != null) {
            String finalRole = normalizedRole;
            String finalStatus = newStatus;
            staffRepository.findByBusinessIdAndUserId(businessId, targetUser.getId())
                    .ifPresent(s -> {
                        s.setName(targetUser.getFullName());
                        s.setPhone(targetUser.getPhone());
                        s.setStaffType(finalRole);
                        s.setActive("ACTIVE".equalsIgnoreCase(finalStatus));
                        staffRepository.save(s);
                    });
        }

        auditLogService.logAction(
                member.getBusiness(),
                currentUser,
                "TEAM_MEMBER_UPDATED",
                "BUSINESS_MEMBER",
                saved.getId().toString(),
                "{\"fullName\":\"" + targetUser.getFullName() + "\",\"role\":\"" + saved.getRole() + "\",\"status\":\"" + saved.getMembershipStatus() + "\"}",
                ipAddress
        );

        return new TeamMemberDto(
                saved.getId(),
                targetUser.getId(),
                targetUser.getFullName(),
                targetUser.getEmail(),
                targetUser.getPhone(),
                saved.getRole(),
                saved.getMembershipStatus(),
                saved.getJoinedAt() != null ? saved.getJoinedAt() : saved.getCreatedAt()
        );
    }

    @Transactional
    public void removeTeamMember(UUID businessId, UUID memberId, User currentUser, String ipAddress) {
        // 1. Try to find and delete BusinessMember
        Optional<BusinessMember> memberOpt = businessMemberRepository.findById(memberId);
        if (memberOpt.isPresent()) {
            BusinessMember member = memberOpt.get();
            if (!member.getBusiness().getId().equals(businessId)) {
                throw new BadRequestException("Member does not belong to this business");
            }

            if ("OWNER".equalsIgnoreCase(member.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(member.getRole())) {
                throw new BadRequestException("The primary business owner cannot be removed");
            }

            Business business = member.getBusiness();
            String memberEmail = member.getUser() != null ? member.getUser().getEmail() : "";
            UUID memberUserId = member.getUser() != null ? member.getUser().getId() : null;

            businessMemberRepository.delete(member);

            // Synchronize with Staff entity by deleting matching staff
            if (memberUserId != null && staffRepository != null) {
                staffRepository.findByBusinessIdAndUserId(businessId, memberUserId)
                        .ifPresent(s -> {
                            try {
                                staffRepository.delete(s);
                            } catch (Exception ex) {
                                s.setActive(false);
                                staffRepository.save(s);
                            }
                        });
            }

            auditLogService.logAction(
                    business,
                    currentUser,
                    "TEAM_MEMBER_REMOVED",
                    "BUSINESS_MEMBER",
                    memberId.toString(),
                    "{\"memberEmail\":\"" + memberEmail + "\"}",
                    ipAddress
            );
            return;
        }

        // 2. Fallback: check if memberId is a Staff record ID
        if (staffRepository != null) {
            Optional<Staff> staffOpt = staffRepository.findById(memberId);
            if (staffOpt.isPresent()) {
                Staff s = staffOpt.get();
                if (!s.getBusiness().getId().equals(businessId)) {
                    throw new BadRequestException("Member does not belong to this business");
                }

                String staffEmail = s.getEmail() != null ? s.getEmail() : "";
                if (s.getUser() != null) {
                    businessMemberRepository.findByBusinessIdAndUserId(businessId, s.getUser().getId())
                            .ifPresent(bm -> {
                                if ("OWNER".equalsIgnoreCase(bm.getRole()) || "BUSINESS_OWNER".equalsIgnoreCase(bm.getRole())) {
                                    throw new BadRequestException("The primary business owner cannot be removed");
                                }
                                businessMemberRepository.delete(bm);
                            });
                }

                try {
                    staffRepository.delete(s);
                } catch (Exception ex) {
                    s.setActive(false);
                    staffRepository.save(s);
                }

                auditLogService.logAction(
                        s.getBusiness(),
                        currentUser,
                        "TEAM_MEMBER_REMOVED",
                        "STAFF",
                        memberId.toString(),
                        "{\"memberEmail\":\"" + staffEmail + "\"}",
                        ipAddress
                );
                return;
            }
        }

        throw new ResourceNotFoundException("Team member not found");
    }
}
