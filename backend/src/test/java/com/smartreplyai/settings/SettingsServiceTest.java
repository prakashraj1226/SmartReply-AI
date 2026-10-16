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
import com.smartreplyai.settings.dto.AiConfigDto;
import com.smartreplyai.settings.dto.BusinessProfileDto;
import com.smartreplyai.settings.dto.InviteMemberRequest;
import com.smartreplyai.settings.dto.TeamMemberDto;
import com.smartreplyai.settings.dto.UpdateTeamMemberRequest;
import com.smartreplyai.staff.Staff;
import com.smartreplyai.subscription.Subscription;
import com.smartreplyai.subscription.SubscriptionPlan;
import com.smartreplyai.subscription.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private BusinessRepository businessRepository;
    @Mock
    private AiConfigurationRepository aiConfigurationRepository;
    @Mock
    private BusinessMemberRepository businessMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private SubscriptionService subscriptionService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private com.smartreplyai.staff.StaffRepository staffRepository;
    @Mock
    private com.smartreplyai.subscription.PlanLimitService planLimitService;

    private SettingsService settingsService;

    @BeforeEach
    void setUp() {
        settingsService = new SettingsService(
                businessRepository,
                aiConfigurationRepository,
                businessMemberRepository,
                userRepository,
                passwordEncoder,
                subscriptionService,
                auditLogService,
                staffRepository,
                planLimitService
        );
    }

    @Test
    @DisplayName("updateBusinessProfile should update details and record audit log")
    void testUpdateBusinessProfile() {
        UUID bId = UUID.randomUUID();
        Business business = new Business("Old Clinic", "old-clinic", "Healthcare", "old@clinic.com", "+919876543200");
        business.setId(bId);

        when(businessRepository.findById(bId)).thenReturn(Optional.of(business));
        when(businessRepository.save(any(Business.class))).thenAnswer(i -> i.getArgument(0));

        BusinessProfileDto dto = new BusinessProfileDto();
        dto.setName("New Smile Dental");
        dto.setPhone("+919876543210");
        dto.setTimezone("Asia/Kolkata");

        User user = new User("owner@smile.com", "hash", "Owner", "BUSINESS_OWNER");

        BusinessProfileDto updated = settingsService.updateBusinessProfile(bId, dto, user, "127.0.0.1");

        assertNotNull(updated);
        assertEquals("New Smile Dental", updated.getName());
        assertEquals("+919876543210", updated.getPhone());
        verify(auditLogService, times(1)).logAction(any(), eq(user), eq("BUSINESS_PROFILE_UPDATED"), eq("BUSINESS"), eq(bId.toString()), any(), eq("127.0.0.1"));
    }

    @Test
    @DisplayName("updateAiConfiguration should update AI assistant behavior")
    void testUpdateAiConfiguration() {
        UUID bId = UUID.randomUUID();
        Business business = new Business("SmileCare", "smilecare", "Healthcare", "info@smilecare.com", "+919876543210");
        business.setId(bId);

        AiConfiguration config = new AiConfiguration(business);
        config.setId(UUID.randomUUID());
        when(businessRepository.findById(bId)).thenReturn(Optional.of(business));
        when(aiConfigurationRepository.findByBusinessId(bId)).thenReturn(Optional.of(config));
        when(aiConfigurationRepository.save(any(AiConfiguration.class))).thenAnswer(i -> i.getArgument(0));

        AiConfigDto dto = new AiConfigDto();
        dto.setAssistantName("Dr. Smile AI");
        dto.setTone("FRIENDLY");
        dto.setGreetingMessage("Welcome to SmileCare!");
        dto.setFallbackMessage("Let me connect you with our receptionist.");
        dto.setConfidenceThreshold(new BigDecimal("0.85"));
        dto.setEnabled(true);
        dto.setMaxResponseTokens(300);

        User user = new User("owner@smilecare.com", "hash", "Owner", "BUSINESS_OWNER");

        AiConfigDto updated = settingsService.updateAiConfiguration(bId, dto, user, "127.0.0.1");

        assertNotNull(updated);
        assertEquals("Dr. Smile AI", updated.getAssistantName());
        assertEquals("FRIENDLY", updated.getTone());
        assertEquals(new BigDecimal("0.85"), updated.getConfidenceThreshold());
    }

    @Test
    @DisplayName("inviteTeamMember should reject invitation if plan agent limit is exceeded")
    void testInviteTeamMember_LimitExceeded() {
        UUID bId = UUID.randomUUID();
        Business business = new Business("SmileCare", "smilecare", "Healthcare", "info@smilecare.com", "+919876543210");
        business.setId(bId);

        SubscriptionPlan starterPlan = new SubscriptionPlan();
        starterPlan.setCode("STARTER");
        starterPlan.setName("Starter Plan");
        starterPlan.setPriceInr(new BigDecimal("499"));
        starterPlan.setMaxConversationsMonthly(500);
        starterPlan.setMaxAgents(1);
        starterPlan.setAiFeaturesEnabled(true);

        Subscription subscription = new Subscription(business, starterPlan, Instant.now(), Instant.now().plusSeconds(86400));

        when(businessRepository.findById(bId)).thenReturn(Optional.of(business));
        doThrow(new BadRequestException("Starter Plan allows a maximum of 1 staff members. Upgrade your plan to add more staff."))
                .when(planLimitService).checkStaffLimit(bId);

        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("agent2@smilecare.com");
        req.setFullName("Agent Two");
        req.setRole("AGENT");

        User user = new User("owner@smilecare.com", "hash", "Owner", "BUSINESS_OWNER");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                settingsService.inviteTeamMember(bId, req, user, "127.0.0.1"));

        assertTrue(ex.getMessage().contains("maximum of 1 staff members"));
    }

    @Test
    @DisplayName("inviteTeamMember should create user, member, sync staff and log audit")
    void testInviteTeamMember_Success() {
        UUID bId = UUID.randomUUID();
        Business business = new Business("SmileCare", "smilecare", "Healthcare", "info@smilecare.com", "+919876543210");
        business.setId(bId);

        SubscriptionPlan starterPlan = new SubscriptionPlan();
        starterPlan.setCode("STARTER");
        starterPlan.setName("Starter Plan");
        starterPlan.setMaxAgents(5);

        Subscription subscription = new Subscription(business, starterPlan, Instant.now(), Instant.now().plusSeconds(86400));

        when(businessRepository.findById(bId)).thenReturn(Optional.of(business));

        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("john@gmail.com");
        req.setFullName("John Doe");
        req.setRole("AGENT");

        when(userRepository.findByEmail("john@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashedPassword");
        User savedUser = new User("john@gmail.com", "hashedPassword", "John Doe", "BUSINESS_AGENT");
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(businessMemberRepository.existsByBusinessIdAndUserId(eq(bId), any())).thenReturn(false);
        when(businessMemberRepository.save(any(BusinessMember.class))).thenAnswer(i -> {
            BusinessMember bm = i.getArgument(0);
            bm.setId(UUID.randomUUID());
            return bm;
        });

        User owner = new User("owner@smilecare.com", "hash", "Owner", "BUSINESS_OWNER");
        com.smartreplyai.settings.dto.TeamMemberDto result = settingsService.inviteTeamMember(bId, req, owner, "127.0.0.1");

        assertNotNull(result);
        assertEquals("john@gmail.com", result.getEmail());
        assertEquals("John Doe", result.getFullName());
        assertEquals("AGENT", result.getRole());
        verify(staffRepository, times(1)).save(any());
        verify(auditLogService, times(1)).logAction(any(), eq(owner), eq("TEAM_MEMBER_ADDED"), any(), any(), any(), eq("127.0.0.1"));
    }

    @Test
    @DisplayName("removeTeamMember should prevent deleting the primary business owner")
    void testRemoveTeamMember_OwnerProtected() {
        UUID bId = UUID.randomUUID();
        Business business = new Business("SmileCare", "smilecare", "Healthcare", "info@smilecare.com", "+919876543210");
        business.setId(bId);

        UUID memberId = UUID.randomUUID();
        User ownerUser = new User("owner@smilecare.com", "hash", "Owner", "BUSINESS_OWNER");
        BusinessMember ownerMember = new BusinessMember(business, ownerUser, "OWNER");
        ownerMember.setId(memberId);

        when(businessMemberRepository.findById(memberId)).thenReturn(Optional.of(ownerMember));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                settingsService.removeTeamMember(bId, memberId, ownerUser, "127.0.0.1"));

        assertEquals("The primary business owner cannot be removed", ex.getMessage());
    }

    @Test
    @DisplayName("updateTeamMember should update staff name, phone, role, status and sync Staff entity")
    void testUpdateTeamMember_Success() {
        UUID bId = UUID.randomUUID();
        Business business = new Business("SmileCare", "smilecare", "Healthcare", "info@smilecare.com", "+919876543210");
        business.setId(bId);

        UUID memberId = UUID.randomUUID();
        UUID staffUserId = UUID.randomUUID();
        User staffUser = new User("staff@smilecare.com", "hash", "Old Name", "BUSINESS_AGENT");
        staffUser.setId(staffUserId);

        BusinessMember member = new BusinessMember(business, staffUser, "AGENT");
        member.setId(memberId);
        member.setMembershipStatus("ACTIVE");

        when(businessMemberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(businessMemberRepository.save(any(BusinessMember.class))).thenAnswer(i -> i.getArgument(0));

        Staff staff = new Staff(business, null, "Old Name", "AGENT", null, "staff@smilecare.com");
        when(staffRepository.findByBusinessIdAndUserId(bId, staffUserId)).thenReturn(Optional.of(staff));

        UpdateTeamMemberRequest req = new UpdateTeamMemberRequest("Updated Name", "+919876543299", "SALON_STAFF", "ACTIVE", "NewSecret@123");
        when(passwordEncoder.encode("NewSecret@123")).thenReturn("newEncodedHash");

        User ownerUser = new User("owner@smilecare.com", "hash", "Owner", "BUSINESS_OWNER");
        TeamMemberDto result = settingsService.updateTeamMember(bId, memberId, req, ownerUser, "127.0.0.1");

        assertNotNull(result);
        assertEquals("Updated Name", result.getFullName());
        assertEquals("+919876543299", result.getPhone());
        assertEquals("SALON_STAFF", result.getRole());
        assertEquals("ACTIVE", result.getMembershipStatus());
        assertEquals("newEncodedHash", staffUser.getPasswordHash());
        assertEquals("Updated Name", staff.getName());
        assertEquals("+919876543299", staff.getPhone());
        assertEquals("SALON_STAFF", staff.getStaffType());
        verify(staffRepository, times(1)).save(staff);
        verify(auditLogService, times(1)).logAction(any(), eq(ownerUser), eq("TEAM_MEMBER_UPDATED"), any(), any(), any(), eq("127.0.0.1"));
    }
}
