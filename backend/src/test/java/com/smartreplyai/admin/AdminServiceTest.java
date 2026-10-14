package com.smartreplyai.admin;

import com.smartreplyai.admin.dto.AdminBusinessDto;
import com.smartreplyai.admin.dto.AdminOverviewDto;
import com.smartreplyai.admin.dto.AdminUserDto;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.subscription.SubscriptionRepository;
import com.smartreplyai.whatsapp.IntegrationAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private BusinessRepository businessRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BusinessMemberRepository businessMemberRepository;
    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private IntegrationAccountRepository integrationAccountRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private com.smartreplyai.appointment.AppointmentRepository appointmentRepository;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                businessRepository,
                userRepository,
                businessMemberRepository,
                conversationRepository,
                messageRepository,
                subscriptionRepository,
                integrationAccountRepository,
                auditLogRepository,
                auditLogService,
                appointmentRepository
        );
    }

    @Test
    @DisplayName("getPlatformOverview should aggregate metrics accurately")
    void testGetPlatformOverview() {
        Business b1 = new Business("Dental Clinic", "dental-clinic", "Healthcare", "info@dental.com", "+919876543210");
        b1.setActive(true);
        Business b2 = new Business("Salon Luxe", "salon-luxe", "Salon", "info@luxe.com", "+919876543211");
        b2.setActive(false);

        when(businessRepository.findAll()).thenReturn(List.of(b1, b2));
        when(userRepository.count()).thenReturn(5L);
        when(conversationRepository.count()).thenReturn(42L);
        when(messageRepository.count()).thenReturn(150L);
        when(subscriptionRepository.findAll()).thenReturn(Collections.emptyList());
        when(integrationAccountRepository.count()).thenReturn(2L);
        when(appointmentRepository.count()).thenReturn(10L);
        when(appointmentRepository.countByStatus("COMPLETED")).thenReturn(7L);

        AdminOverviewDto overview = adminService.getPlatformOverview();

        assertNotNull(overview);
        assertEquals(2, overview.getTotalBusinesses());
        assertEquals(1, overview.getActiveBusinesses());
        assertEquals(5, overview.getTotalUsers());
        assertEquals(42, overview.getTotalConversations());
        assertEquals(150, overview.getTotalMessages());
        assertEquals(2, overview.getActiveIntegrations());
        assertEquals(10, overview.getTotalAppointments());
        assertEquals(7, overview.getCompletedAppointments());
        assertNotNull(overview.getBusinessesByIndustry());
        assertEquals(1L, overview.getBusinessesByIndustry().get("Healthcare"));
        assertEquals(1L, overview.getBusinessesByIndustry().get("Salon"));
    }

    @Test
    @DisplayName("updateBusinessStatus should toggle active state and record audit log")
    void testUpdateBusinessStatus() {
        UUID bId = UUID.randomUUID();
        Business business = new Business("Test Business", "test-biz", "Services", "biz@test.com", "+919876543210");
        business.setId(bId);
        business.setActive(true);

        when(businessRepository.findById(bId)).thenReturn(Optional.of(business));
        when(businessRepository.save(any(Business.class))).thenAnswer(i -> i.getArgument(0));

        User adminUser = new User("admin@smartreply.ai", "hash", "Super Admin", "SUPER_ADMIN");

        AdminBusinessDto result = adminService.updateBusinessStatus(bId, false, adminUser, "127.0.0.1");

        assertFalse(result.isActive());
        verify(auditLogService, times(1)).logAction(any(), eq(adminUser), eq("BUSINESS_SUSPENDED"), eq("BUSINESS"), eq(bId.toString()), any(), eq("127.0.0.1"));
    }

    @Test
    @DisplayName("getAllUsers should map user properties correctly")
    void testGetAllUsers() {
        User u = new User("agent@clinic.com", "hash", "Dr. Agent", "BUSINESS_AGENT");
        when(userRepository.findAll()).thenReturn(List.of(u));
        when(businessMemberRepository.findAll()).thenReturn(Collections.emptyList());

        List<AdminUserDto> users = adminService.getAllUsers();
        assertEquals(1, users.size());
        assertEquals("agent@clinic.com", users.get(0).getEmail());
        assertEquals("BUSINESS_AGENT", users.get(0).getRole());
    }
}
