package com.smartreplyai.tenant;

import com.smartreplyai.ai.dto.AiGenerationRequest;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.ai.provider.RuleBasedKnowledgeAiProvider;
import com.smartreplyai.appointment.Appointment;
import com.smartreplyai.appointment.AppointmentRepository;
import com.smartreplyai.appointment.AppointmentService;
import com.smartreplyai.appointment.dto.AppointmentDto;
import com.smartreplyai.appointment.dto.CreateAppointmentRequest;
import com.smartreplyai.appointment.dto.TimeSlotDto;
import com.smartreplyai.appointment.dto.UpdateAppointmentStatusRequest;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.branch.BranchService;
import com.smartreplyai.branch.dto.UpdateBranchRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.business.onboarding.ApplyTemplateRequest;
import com.smartreplyai.business.onboarding.BusinessOnboardingService;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.security.TenantRole;
import com.smartreplyai.security.TenantSecurityService;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.servicecatalog.ServiceCatalogService;
import com.smartreplyai.staff.*;
import com.smartreplyai.staff.dto.UpdateStaffRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Multi-Tenant End-to-End Scenario Suite (Phase 10)
 *
 * Verifies full end-to-end multi-tenant lifecycle across all 4 supported industries:
 * 1. SALON: Template provisioning -> Slot calculation -> Booking -> Status transitions -> Conflict protection.
 * 2. DENTAL_CLINIC: Template provisioning -> Doctor leave conflict shielding -> Grounded WhatsApp AI Booking.
 * 3. HOSPITAL: Multi-department OPD -> Strict Cross-Tenant isolation & boundary protection.
 * 4. GENERAL: Template provisioning -> Tenant RBAC hierarchy and role permission enforcement.
 */
@ExtendWith(MockitoExtension.class)
class MultiTenantEndToEndScenarioTest {

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private ServiceItemRepository serviceItemRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private StaffServiceMappingRepository staffServiceMappingRepository;

    @Mock
    private StaffAvailabilityRepository staffAvailabilityRepository;

    @Mock
    private StaffLeaveRepository staffLeaveRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.smartreplyai.subscription.PlanLimitService planLimitService;

    private TenantSecurityService tenantSecurityService;
    private BusinessOnboardingService onboardingService;
    private BranchService branchService;
    private ServiceCatalogService serviceCatalogService;
    private StaffService staffService;
    private AppointmentService appointmentService;
    private RuleBasedKnowledgeAiProvider aiProvider;

    @BeforeEach
    void setUp() {
        tenantSecurityService = new TenantSecurityService();

        onboardingService = new BusinessOnboardingService(
                businessRepository, branchRepository, serviceItemRepository,
                staffRepository, staffServiceMappingRepository, staffAvailabilityRepository
        );

        branchService = new BranchService(branchRepository, businessRepository);
        serviceCatalogService = new ServiceCatalogService(serviceItemRepository, businessRepository, branchRepository);

        staffService = new StaffService(
                staffRepository, businessRepository, branchRepository, userRepository,
                serviceItemRepository, staffServiceMappingRepository, staffAvailabilityRepository, staffLeaveRepository,
                planLimitService
        );

        appointmentService = new AppointmentService(
                appointmentRepository, businessRepository, customerRepository, branchRepository,
                serviceItemRepository, staffRepository, staffServiceMappingRepository,
                staffAvailabilityRepository, staffLeaveRepository, userRepository, tenantSecurityService,
                planLimitService
        );

        aiProvider = new RuleBasedKnowledgeAiProvider(appointmentService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // =========================================================================
    // SCENARIO 1: SALON & SPA TENANT LIFECYCLE
    // =========================================================================

    @Test
    @DisplayName("Scenario 1 [SALON]: Provision salon catalog -> compute slots -> book appointment -> fulfill -> prevent duplicate booking")
    void testSalonIndustryLifecycle_FromTemplateToAppointmentFulfillment() {
        UUID salonBusinessId = UUID.randomUUID();
        Business salon = new Business("Luxe Hair Lounge & Spa", "luxe-hair", "SALON", "contact@luxehair.com", "+919876543001");
        salon.setId(salonBusinessId);
        salon.setTimezone("Asia/Kolkata");

        when(businessRepository.findById(salonBusinessId)).thenReturn(Optional.of(salon));
        when(branchRepository.findByBusinessId(salonBusinessId)).thenReturn(Collections.emptyList());

        Branch salonBranch = new Branch(salon, "Main Studio", "101 Fashion Blvd", "+919876543001", "Asia/Kolkata");
        salonBranch.setId(UUID.randomUUID());
        when(branchRepository.save(any(Branch.class))).thenReturn(salonBranch);

        when(serviceItemRepository.save(any(ServiceItem.class))).thenAnswer(i -> {
            ServiceItem item = i.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });

        when(staffRepository.save(any(Staff.class))).thenAnswer(i -> {
            Staff st = i.getArgument(0);
            st.setId(UUID.randomUUID());
            return st;
        });

        // 1. Apply SALON Onboarding Preset
        var onboardingResult = onboardingService.applyTemplate(salonBusinessId, new ApplyTemplateRequest("SALON"));
        assertNotNull(onboardingResult);
        assertEquals("SALON", onboardingResult.get("industryType"));
        assertEquals(5, onboardingResult.get("servicesCreated"));
        assertEquals(2, onboardingResult.get("staffCreated"));
        assertTrue((Boolean) onboardingResult.get("onboardingCompleted"));

        // 2. Setup Slot Calculation for Stylist Emma Stone
        UUID emmaStaffId = UUID.randomUUID();
        Staff emmaStone = new Staff(salon, salonBranch, "Emma Stone", "Senior Stylist", "+919876543002", "emma@luxehair.com");
        emmaStone.setId(emmaStaffId);
        emmaStone.setActive(true);

        UUID haircutServiceId = UUID.randomUUID();
        ServiceItem haircut = new ServiceItem(salon, salonBranch, "Haircut & Styling", "HAIR", 45, new BigDecimal("600"));
        haircut.setId(haircutServiceId);

        LocalDate nextMonday = LocalDate.now().plusWeeks(1).with(DayOfWeek.MONDAY);
        when(serviceItemRepository.findByBusinessIdAndId(salonBusinessId, haircutServiceId)).thenReturn(Optional.of(haircut));
        when(staffRepository.findByBusinessIdAndId(salonBusinessId, emmaStaffId)).thenReturn(Optional.of(emmaStone));
        when(staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(salonBusinessId, emmaStaffId, nextMonday, "APPROVED"))
                .thenReturn(false);

        // Monday Shift: 09:00 - 18:00, lunch break 13:00 - 14:00
        StaffAvailability mondayAvail = new StaffAvailability(
                salon, emmaStone, salonBranch, 1,
                LocalTime.of(9, 0), LocalTime.of(18, 0),
                LocalTime.of(13, 0), LocalTime.of(14, 0)
        );
        when(staffAvailabilityRepository.findByBusinessIdAndStaffIdAndDayOfWeek(salonBusinessId, emmaStaffId, 1))
                .thenReturn(Optional.of(mondayAvail));
        when(appointmentRepository.findActiveAppointmentsInRange(eq(salonBusinessId), any(), eq(emmaStaffId), any(), any()))
                .thenReturn(Collections.emptyList());

        List<TimeSlotDto> slots = appointmentService.getAvailableSlots(salonBusinessId, salonBranch.getId(), haircutServiceId, emmaStaffId, nextMonday);
        assertNotNull(slots);
        assertFalse(slots.isEmpty(), "Available slots should be generated for Emma Stone on Monday");
        // Verify lunch break exclusion (no slot starting with 13:)
        for (TimeSlotDto slot : slots) {
            assertFalse(slot.getTimeFormatted().startsWith("13:"), "Slots must not fall within lunch break (13:00-14:00)");
        }

        // 3. Book Appointment for Customer "Sophie Turner"
        Instant startTime = nextMonday.atTime(10, 0).atZone(ZoneId.of("Asia/Kolkata")).toInstant();
        Instant endTime = startTime.plusSeconds(45 * 60);

        when(customerRepository.findByBusinessIdAndPhoneNumber(salonBusinessId, "+919876543111")).thenReturn(Optional.empty());
        Customer createdCustomer = new Customer(salon, "+919876543111", "Sophie Turner", "sophie@example.com");
        createdCustomer.setId(UUID.randomUUID());
        when(customerRepository.save(any(Customer.class))).thenReturn(createdCustomer);

        when(appointmentRepository.countConflictingStaffAppointments(salonBusinessId, null, emmaStaffId, startTime, endTime)).thenReturn(0L);

        UUID appointmentId = UUID.randomUUID();
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(appointmentId);
            return a;
        });

        CreateAppointmentRequest bookReq = new CreateAppointmentRequest();
        bookReq.setCustomerName("Sophie Turner");
        bookReq.setCustomerPhone("+919876543111");
        bookReq.setServiceId(haircutServiceId);
        bookReq.setStaffId(emmaStaffId);
        bookReq.setStartTime(startTime);
        bookReq.setEndTime(endTime);
        bookReq.setBookingSource("WEB");

        AppointmentDto bookedApt = appointmentService.createAppointment(salonBusinessId, bookReq);
        assertNotNull(bookedApt);
        assertEquals("Haircut & Styling", bookedApt.getServiceName());
        assertEquals("Emma Stone", bookedApt.getStaffName());
        assertEquals("CONFIRMED", bookedApt.getStatus());

        // 4. Appointment Status Lifecycle: CHECKED_IN -> COMPLETED
        Appointment existingApt = new Appointment(salon, createdCustomer, "Haircut & Styling", "Emma Stone", startTime, endTime, "CONFIRMED", null);
        existingApt.setId(appointmentId);
        existingApt.setStaff(emmaStone);
        existingApt.setServiceItem(haircut);

        when(appointmentRepository.findByBusinessIdAndId(salonBusinessId, appointmentId)).thenReturn(Optional.of(existingApt));

        AppointmentDto checkInResult = appointmentService.updateAppointmentStatus(
                salonBusinessId, appointmentId, new UpdateAppointmentStatusRequest("CHECKED_IN")
        );
        assertEquals("CHECKED_IN", checkInResult.getStatus());

        AppointmentDto completedResult = appointmentService.updateAppointmentStatus(
                salonBusinessId, appointmentId, new UpdateAppointmentStatusRequest("COMPLETED")
        );
        assertEquals("COMPLETED", completedResult.getStatus());

        // 5. Duplicate Booking Conflict Protection
        when(appointmentRepository.countConflictingStaffAppointments(salonBusinessId, null, emmaStaffId, startTime, endTime)).thenReturn(1L);
        BadRequestException conflictEx = assertThrows(BadRequestException.class, () ->
                appointmentService.createAppointment(salonBusinessId, bookReq)
        );
        assertTrue(conflictEx.getMessage().contains("already booked for Emma Stone"));
    }

    // =========================================================================
    // SCENARIO 2: DENTAL CLINIC TENANT LIFECYCLE & LEAVE SHIELD
    // =========================================================================

    @Test
    @DisplayName("Scenario 2 [DENTAL]: Doctor leave conflict shielding -> safe AI WhatsApp slot discovery and booking")
    void testDentalClinicIndustryLifecycle_DoctorLeaveShieldAndWhatsAppAiBooking() {
        UUID dentalBusinessId = UUID.randomUUID();
        Business dental = new Business("SmileCare Speciality Dental", "smilecare-dental", "DENTAL_CLINIC", "care@smilecare.com", "+919876543003");
        dental.setId(dentalBusinessId);
        dental.setTimezone("Asia/Kolkata");

        when(businessRepository.findById(dentalBusinessId)).thenReturn(Optional.of(dental));
        when(branchRepository.findByBusinessId(dentalBusinessId)).thenReturn(Collections.emptyList());

        Branch dentalBranch = new Branch(dental, "Dental Care Clinic", "204 Health Ave", "+919876543003", "Asia/Kolkata");
        dentalBranch.setId(UUID.randomUUID());
        when(branchRepository.save(any(Branch.class))).thenReturn(dentalBranch);

        when(serviceItemRepository.save(any(ServiceItem.class))).thenAnswer(i -> {
            ServiceItem item = i.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });
        when(staffRepository.save(any(Staff.class))).thenAnswer(i -> {
            Staff st = i.getArgument(0);
            st.setId(UUID.randomUUID());
            return st;
        });

        // 1. Provision DENTAL_CLINIC preset
        var onboardingResult = onboardingService.applyTemplate(dentalBusinessId, new ApplyTemplateRequest("DENTAL_CLINIC"));
        assertEquals("DENTAL_CLINIC", onboardingResult.get("industryType"));
        assertEquals(5, onboardingResult.get("servicesCreated"));
        assertEquals(2, onboardingResult.get("staffCreated"));

        // 2. Doctor Leave Shield: Dr. Jenkins on Leave vs Dr. Chen Available
        UUID jenkinsId = UUID.randomUUID();
        Staff drJenkins = new Staff(dental, dentalBranch, "Dr. Sarah Jenkins", "Endodontist", "+919876543004", "jenkins@smilecare.com");
        drJenkins.setId(jenkinsId);
        drJenkins.setActive(true);

        UUID chenId = UUID.randomUUID();
        Staff drChen = new Staff(dental, dentalBranch, "Dr. Robert Chen", "General Dentist", "+919876543005", "chen@smilecare.com");
        drChen.setId(chenId);
        drChen.setActive(true);

        LocalDate leaveDate = LocalDate.now().plusDays(2);

        // Dr. Jenkins has APPROVED leave
        when(staffRepository.findByBusinessIdAndId(dentalBusinessId, jenkinsId)).thenReturn(Optional.of(drJenkins));
        when(staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(dentalBusinessId, jenkinsId, leaveDate, "APPROVED"))
                .thenReturn(true);

        List<TimeSlotDto> jenkinsSlots = appointmentService.getAvailableSlots(dentalBusinessId, null, null, jenkinsId, leaveDate);
        assertTrue(jenkinsSlots.isEmpty(), "Practitioner on approved leave must return zero available slots");

        // Dr. Chen has NO leave and is available
        when(staffRepository.findByBusinessIdAndId(dentalBusinessId, chenId)).thenReturn(Optional.of(drChen));
        when(staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(dentalBusinessId, chenId, leaveDate, "APPROVED"))
                .thenReturn(false);

        StaffAvailability chenAvail = new StaffAvailability(
                dental, drChen, dentalBranch, leaveDate.getDayOfWeek().getValue(),
                LocalTime.of(9, 0), LocalTime.of(17, 0),
                LocalTime.of(13, 0), LocalTime.of(14, 0)
        );
        when(staffAvailabilityRepository.findByBusinessIdAndStaffIdAndDayOfWeek(dentalBusinessId, chenId, leaveDate.getDayOfWeek().getValue()))
                .thenReturn(Optional.of(chenAvail));
        when(appointmentRepository.findActiveAppointmentsInRange(eq(dentalBusinessId), any(), eq(chenId), any(), any()))
                .thenReturn(Collections.emptyList());

        List<TimeSlotDto> chenSlots = appointmentService.getAvailableSlots(dentalBusinessId, null, null, chenId, leaveDate);
        assertFalse(chenSlots.isEmpty(), "Available doctor without leave must return computed available slots");

        // 3. Grounded WhatsApp AI Booking
        ServiceItem rootCanal = new ServiceItem(dental, dentalBranch, "Root Canal Treatment", "DENTAL", 60, new BigDecimal("3500"));
        rootCanal.setId(UUID.randomUUID());

        Instant slotStart = leaveDate.atTime(10, 0).atZone(ZoneId.of("Asia/Kolkata")).toInstant();
        Instant slotEnd = slotStart.plusSeconds(3600);
        TimeSlotDto matchingSlot = new TimeSlotDto(slotStart, slotEnd, "10:00 - 11:00", true);

        // Mock appointment service for AI provider booking invocation
        AppointmentService mockAptService = mock(AppointmentService.class);
        when(mockAptService.getAvailableSlots(eq(dentalBusinessId), isNull(), eq(rootCanal.getId()), isNull(), any()))
                .thenReturn(List.of(matchingSlot));

        AppointmentDto aiBookedApt = new AppointmentDto();
        aiBookedApt.setId(UUID.randomUUID());
        aiBookedApt.setServiceName("Root Canal Treatment");
        aiBookedApt.setStaffName("Dr. Robert Chen");
        aiBookedApt.setStartTime(slotStart);
        aiBookedApt.setEndTime(slotEnd);
        aiBookedApt.setStatus("CONFIRMED");
        when(mockAptService.createAppointment(eq(dentalBusinessId), any())).thenReturn(aiBookedApt);

        RuleBasedKnowledgeAiProvider groundedAi = new RuleBasedKnowledgeAiProvider(mockAptService);

        AiGenerationRequest aiReq = new AiGenerationRequest();
        aiReq.setBusinessId(dentalBusinessId);
        aiReq.setBusinessName("SmileCare Speciality Dental");
        aiReq.setCustomerName("Vikram Singhania");
        aiReq.setCustomerPhoneNumber("+919876500999");
        aiReq.setCustomerMessage("Please book Root Canal Treatment tomorrow at 10:00");
        aiReq.setServices(List.of(rootCanal));
        aiReq.setStaffMembers(List.of(drChen));

        AiGenerationResponse aiResp = groundedAi.generateReply(aiReq);
        assertNotNull(aiResp);
        assertFalse(aiResp.isEscalated());
        assertTrue(aiResp.getReplyText().contains("Root Canal Treatment"));
        assertTrue(aiResp.getReplyText().contains("appointment has been successfully confirmed"));
        verify(mockAptService, times(1)).createAppointment(eq(dentalBusinessId), any());
    }

    // =========================================================================
    // SCENARIO 3: HOSPITAL & OPD TENANT LIFECYCLE & CROSS-TENANT DATA ISOLATION
    // =========================================================================

    @Test
    @DisplayName("Scenario 3 [HOSPITAL]: Multi-department OPD -> strict cross-tenant data isolation shield")
    void testHospitalIndustryLifecycle_DepartmentIsolationAndStrictCrossTenantBoundary() {
        UUID hospitalBusinessId = UUID.randomUUID();
        Business hospital = new Business("Metro Care Multispeciality Hospital", "metrocare-hosp", "HOSPITAL", "info@metrocare.com", "+919876543006");
        hospital.setId(hospitalBusinessId);
        hospital.setTimezone("Asia/Kolkata");

        UUID salonBusinessId = UUID.randomUUID();
        Business salon = new Business("Salon A", "salon-a", "SALON", "a@salon.com", "+919876543007");
        salon.setId(salonBusinessId);

        when(businessRepository.findById(hospitalBusinessId)).thenReturn(Optional.of(hospital));
        when(branchRepository.findByBusinessId(hospitalBusinessId)).thenReturn(Collections.emptyList());

        Branch hospitalBranch = new Branch(hospital, "Main Hospital - OPD Wing", "500 Health Expressway", "+919876543006", "Asia/Kolkata");
        hospitalBranch.setId(UUID.randomUUID());
        when(branchRepository.save(any(Branch.class))).thenReturn(hospitalBranch);

        when(serviceItemRepository.save(any(ServiceItem.class))).thenAnswer(i -> {
            ServiceItem item = i.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });
        when(staffRepository.save(any(Staff.class))).thenAnswer(i -> {
            Staff st = i.getArgument(0);
            st.setId(UUID.randomUUID());
            return st;
        });

        // 1. Provision HOSPITAL preset
        var onboardingResult = onboardingService.applyTemplate(hospitalBusinessId, new ApplyTemplateRequest("HOSPITAL"));
        assertEquals("HOSPITAL", onboardingResult.get("industryType"));
        assertEquals(4, onboardingResult.get("servicesCreated"));
        assertEquals(2, onboardingResult.get("staffCreated"));

        // 2. Strict Cross-Tenant Isolation: Hospital cannot query or mutate Salon resources
        UUID salonAppointmentId = UUID.randomUUID();
        UUID salonBranchId = UUID.randomUUID();
        UUID salonStaffId = UUID.randomUUID();

        // Hospital queries Salon's appointment ID -> Expect ResourceNotFoundException
        when(appointmentRepository.findByBusinessIdAndId(hospitalBusinessId, salonAppointmentId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.getAppointmentById(hospitalBusinessId, salonAppointmentId)
        );

        // Hospital updates Salon's appointment status -> Expect ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.updateAppointmentStatus(hospitalBusinessId, salonAppointmentId, new UpdateAppointmentStatusRequest("CANCELLED"))
        );

        // Hospital attempts to update Salon's branch -> Expect ResourceNotFoundException
        when(branchRepository.findByBusinessIdAndId(hospitalBusinessId, salonBranchId)).thenReturn(Optional.empty());
        UpdateBranchRequest branchReq = new UpdateBranchRequest();
        branchReq.setName("Hijacked Branch");
        assertThrows(ResourceNotFoundException.class, () ->
                branchService.updateBranch(hospitalBusinessId, salonBranchId, branchReq)
        );

        // Hospital attempts to update Salon's staff -> Expect ResourceNotFoundException
        when(staffRepository.findByBusinessIdAndId(hospitalBusinessId, salonStaffId)).thenReturn(Optional.empty());
        UpdateStaffRequest staffReq = new UpdateStaffRequest();
        staffReq.setName("Hijacked Staff");
        assertThrows(ResourceNotFoundException.class, () ->
                staffService.updateStaff(hospitalBusinessId, salonStaffId, staffReq)
        );
    }

    // =========================================================================
    // SCENARIO 4: GENERAL BUSINESS & TENANT RBAC ENFORCEMENT
    // =========================================================================

    @Test
    @DisplayName("Scenario 4 [GENERAL]: Tenant RBAC permissions -> Owner vs Receptionist vs Staff boundaries")
    void testGeneralBusinessIndustryLifecycle_TenantRbacBoundaryEnforcement() {
        UUID generalBusinessId = UUID.randomUUID();
        Business generalBiz = new Business("Horizon Global Advisory", "horizon-advisory", "GENERAL", "contact@horizon.com", "+919876543008");
        generalBiz.setId(generalBusinessId);

        when(businessRepository.findById(generalBusinessId)).thenReturn(Optional.of(generalBiz));
        when(branchRepository.findByBusinessId(generalBusinessId)).thenReturn(Collections.emptyList());

        Branch mainOffice = new Branch(generalBiz, "Headquarters", "700 Financial District", "+919876543008", "Asia/Kolkata");
        mainOffice.setId(UUID.randomUUID());
        when(branchRepository.save(any(Branch.class))).thenReturn(mainOffice);

        when(serviceItemRepository.save(any(ServiceItem.class))).thenAnswer(i -> {
            ServiceItem item = i.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });
        when(staffRepository.save(any(Staff.class))).thenAnswer(i -> {
            Staff st = i.getArgument(0);
            st.setId(UUID.randomUUID());
            return st;
        });

        // 1. Provision GENERAL preset
        var onboardingResult = onboardingService.applyTemplate(generalBusinessId, new ApplyTemplateRequest("GENERAL"));
        assertEquals("GENERAL", onboardingResult.get("industryType"));
        assertEquals(2, onboardingResult.get("servicesCreated"));
        assertEquals(1, onboardingResult.get("staffCreated"));

        // 2. RBAC: BUSINESS_OWNER Permissions
        TenantContext.setBusinessId(generalBusinessId);
        TenantContext.setRole("BUSINESS_OWNER");

        assertTrue(tenantSecurityService.isOwnerOrAdmin());
        assertTrue(tenantSecurityService.canManageTeam());
        assertTrue(tenantSecurityService.canManageBilling());
        assertTrue(tenantSecurityService.canManageAi());
        assertTrue(tenantSecurityService.canManageCatalog());
        assertTrue(tenantSecurityService.canManageAppointments());

        // 3. RBAC: RECEPTIONIST Permissions (Front-desk operations only)
        TenantContext.setRole("RECEPTIONIST");

        assertFalse(tenantSecurityService.isOwnerOrAdmin());
        assertTrue(tenantSecurityService.canManageAppointments(), "Receptionist can manage appointments");
        assertTrue(tenantSecurityService.canViewAppointments(), "Receptionist can view appointments");
        assertFalse(tenantSecurityService.canManageBilling(), "Receptionist cannot manage billing");
        assertFalse(tenantSecurityService.canManageAi(), "Receptionist cannot alter AI configuration");
        assertFalse(tenantSecurityService.canManageTeam(), "Receptionist cannot invite or manage team members");

        // 4. RBAC: SALON_STAFF / DOCTOR Practitioner Scoping
        UUID practitionerStaffId = UUID.randomUUID();
        UUID otherStaffId = UUID.randomUUID();

        TenantContext.setRole("DOCTOR");
        TenantContext.setStaffId(practitionerStaffId);

        assertTrue(tenantSecurityService.canAccessStaffAppointment(practitionerStaffId), "Practitioner can view their own appointments");
        assertFalse(tenantSecurityService.canAccessStaffAppointment(otherStaffId), "Practitioner cannot access other practitioner appointments");
        assertFalse(tenantSecurityService.canManageBilling(), "Practitioner cannot manage billing");
        assertFalse(tenantSecurityService.canManageAi(), "Practitioner cannot configure AI");

        // 5. Verification of TenantRole matrix
        assertTrue(TenantRole.hasPermission("BUSINESS_OWNER", "MANAGE_BILLING"));
        assertTrue(TenantRole.hasPermission("RECEPTIONIST", "MANAGE_APPOINTMENTS"));
        assertFalse(TenantRole.hasPermission("RECEPTIONIST", "MANAGE_BILLING"));
        assertTrue(TenantRole.hasPermission("DOCTOR", "VIEW_APPOINTMENTS"));
        assertFalse(TenantRole.hasPermission("DOCTOR", "MANAGE_BILLING"));
    }
}
