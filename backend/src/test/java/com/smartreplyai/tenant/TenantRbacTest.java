package com.smartreplyai.tenant;

import com.smartreplyai.admin.AuditLogService;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.security.TenantRole;
import com.smartreplyai.security.TenantSecurityService;
import com.smartreplyai.settings.SettingsService;
import com.smartreplyai.settings.dto.InviteMemberRequest;
import com.smartreplyai.settings.dto.TeamMemberDto;
import com.smartreplyai.settings.dto.UpdateMemberRoleRequest;
import com.smartreplyai.settings.dto.UpdateMemberStatusRequest;
import com.smartreplyai.subscription.Subscription;
import com.smartreplyai.subscription.SubscriptionPlan;
import com.smartreplyai.subscription.SubscriptionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantRbacTest {

    @Mock
    private BusinessRepository businessRepository;

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

    @InjectMocks
    private SettingsService settingsService;

    private TenantSecurityService tenantSecurityService;

    private UUID businessId;
    private Business testBusiness;
    private User ownerUser;
    private User doctorUser;
    private BusinessMember ownerMember;
    private BusinessMember doctorMember;

    @BeforeEach
    void setUp() {
        tenantSecurityService = new TenantSecurityService();
        businessId = UUID.randomUUID();

        testBusiness = new Business("Royal Hair Studio", "royal-hair", "SALON", "contact@royalhair.com", "+919876500001");
        testBusiness.setId(businessId);

        ownerUser = new User("owner@royalhair.com", "hash", "Rajesh Owner", "BUSINESS_OWNER");
        ownerUser.setId(UUID.randomUUID());

        doctorUser = new User("doctor@royalhair.com", "hash", "Dr. Aravind", "BUSINESS_AGENT");
        doctorUser.setId(UUID.randomUUID());

        ownerMember = new BusinessMember(testBusiness, ownerUser, "BUSINESS_OWNER");
        ownerMember.setId(UUID.randomUUID());

        doctorMember = new BusinessMember(testBusiness, doctorUser, "DOCTOR");
        doctorMember.setId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Verify TenantRole permission hierarchy and module access limits")
    void testTenantRolePermissions() {
        // Business Owner has ALL permissions
        assertTrue(TenantRole.hasPermission("BUSINESS_OWNER", "MANAGE_BILLING"));
        assertTrue(TenantRole.hasPermission("BUSINESS_OWNER", "MANAGE_AI"));
        assertTrue(TenantRole.hasPermission("BUSINESS_OWNER", "MANAGE_APPOINTMENTS"));

        // Receptionist can manage appointments, but CANNOT manage AI, billing, or team
        assertTrue(TenantRole.hasPermission("RECEPTIONIST", "MANAGE_APPOINTMENTS"));
        assertTrue(TenantRole.hasPermission("RECEPTIONIST", "VIEW_CUSTOMERS"));
        assertFalse(TenantRole.hasPermission("RECEPTIONIST", "MANAGE_AI"));
        assertFalse(TenantRole.hasPermission("RECEPTIONIST", "MANAGE_BILLING"));
        assertFalse(TenantRole.hasPermission("RECEPTIONIST", "MANAGE_TEAM"));

        // Doctor/Dentist can view appointments and manage own appointments, but CANNOT manage AI or billing
        assertTrue(TenantRole.hasPermission("DOCTOR", "VIEW_APPOINTMENTS"));
        assertTrue(TenantRole.hasPermission("DENTIST", "VIEW_APPOINTMENTS"));
        assertFalse(TenantRole.hasPermission("DOCTOR", "MANAGE_AI"));
        assertFalse(TenantRole.hasPermission("DENTIST", "MANAGE_BILLING"));

        // Salon Staff can view appointments
        assertTrue(TenantRole.hasPermission("SALON_STAFF", "VIEW_APPOINTMENTS"));
        assertFalse(TenantRole.hasPermission("SALON_STAFF", "MANAGE_CUSTOMERS"));
    }

    @Test
    @DisplayName("Verify TenantSecurityService evaluation using TenantContext")
    void testTenantSecurityServiceEvaluation() {
        TenantContext.setBusinessId(businessId);
        TenantContext.setRole("RECEPTIONIST");
        TenantContext.setMembershipStatus("ACTIVE");

        assertTrue(tenantSecurityService.canManageAppointments());
        assertFalse(tenantSecurityService.canManageBilling());
        assertFalse(tenantSecurityService.canManageAi());
        assertFalse(tenantSecurityService.canManageTeam());

        // Now set as Owner
        TenantContext.setRole("BUSINESS_OWNER");
        assertTrue(tenantSecurityService.isOwnerOrAdmin());
        assertTrue(tenantSecurityService.canManageTeam());
        assertTrue(tenantSecurityService.canManageBilling());
        assertTrue(tenantSecurityService.canManageAi());
    }

    @Test
    @DisplayName("Verify doctor appointment scoping (can only access assigned staff appointment)")
    void testDoctorAppointmentScoping() {
        UUID doctorStaffId = UUID.randomUUID();
        UUID otherStaffId = UUID.randomUUID();

        TenantContext.setBusinessId(businessId);
        TenantContext.setRole("DOCTOR");
        TenantContext.setStaffId(doctorStaffId);

        // Can access own appointment
        assertTrue(tenantSecurityService.canAccessStaffAppointment(doctorStaffId));
        // Cannot access appointment assigned to other practitioner
        assertFalse(tenantSecurityService.canAccessStaffAppointment(otherStaffId));

        // When Owner or Receptionist, can access all appointments
        TenantContext.setRole("RECEPTIONIST");
        assertTrue(tenantSecurityService.canAccessStaffAppointment(otherStaffId));
    }

    @Test
    @DisplayName("Verify inviting a team member with an industry role (DOCTOR)")
    void testInviteTeamMemberWithIndustryRole() {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setCode("GROWTH");
        plan.setName("Growth Plan");
        plan.setMaxAgents(5);
        Subscription sub = new Subscription(testBusiness, plan);

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(subscriptionService.getOrInitSubscription(businessId)).thenReturn(sub);
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of(ownerMember));
        when(userRepository.findByEmail("dr.aravind@royalhair.com")).thenReturn(Optional.of(doctorUser));
        when(businessMemberRepository.existsByBusinessIdAndUserId(businessId, doctorUser.getId())).thenReturn(false);
        when(businessMemberRepository.save(any(BusinessMember.class))).thenAnswer(i -> {
            BusinessMember m = i.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("dr.aravind@royalhair.com");
        req.setFullName("Dr. Aravind");
        req.setRole("DOCTOR");

        TeamMemberDto dto = settingsService.inviteTeamMember(businessId, req, ownerUser, "127.0.0.1");

        assertNotNull(dto);
        assertEquals("DOCTOR", dto.getRole());
        assertEquals("ACTIVE", dto.getMembershipStatus());
        verify(businessMemberRepository).save(any(BusinessMember.class));
    }

    @Test
    @DisplayName("Prevent role escalation to Owner via invitation")
    void testPreventRoleEscalationToOwner() {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setCode("GROWTH");
        plan.setName("Growth Plan");
        plan.setMaxAgents(5);
        Subscription sub = new Subscription(testBusiness, plan);

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(subscriptionService.getOrInitSubscription(businessId)).thenReturn(sub);
        when(businessMemberRepository.findByBusinessId(businessId)).thenReturn(List.of(ownerMember));

        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("intruder@example.com");
        req.setFullName("Intruder");
        req.setRole("OWNER");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                settingsService.inviteTeamMember(businessId, req, ownerUser, "127.0.0.1")
        );

        assertTrue(ex.getMessage().contains("Cannot assign Owner role"));
    }

    @Test
    @DisplayName("Verify updating a member's role and status (suspend membership)")
    void testUpdateRoleAndSuspendMembership() {
        when(businessMemberRepository.findById(doctorMember.getId())).thenReturn(Optional.of(doctorMember));
        when(businessMemberRepository.save(any(BusinessMember.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Update role to Manager
        UpdateMemberRoleRequest roleReq = new UpdateMemberRoleRequest("MANAGER");
        TeamMemberDto updatedRole = settingsService.updateTeamMemberRole(businessId, doctorMember.getId(), roleReq, ownerUser, "127.0.0.1");
        assertEquals("MANAGER", updatedRole.getRole());

        // 2. Suspend membership
        UpdateMemberStatusRequest statusReq = new UpdateMemberStatusRequest("SUSPENDED");
        TeamMemberDto suspendedMember = settingsService.updateTeamMemberStatus(businessId, doctorMember.getId(), statusReq, ownerUser, "127.0.0.1");
        assertEquals("SUSPENDED", suspendedMember.getMembershipStatus());

        // 3. Ensure owner cannot be suspended
        when(businessMemberRepository.findById(ownerMember.getId())).thenReturn(Optional.of(ownerMember));
        assertThrows(BadRequestException.class, () ->
                settingsService.updateTeamMemberStatus(businessId, ownerMember.getId(), statusReq, ownerUser, "127.0.0.1")
        );
    }
}
