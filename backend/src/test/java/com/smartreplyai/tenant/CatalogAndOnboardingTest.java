package com.smartreplyai.tenant;

import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.branch.BranchService;
import com.smartreplyai.branch.dto.CreateBranchRequest;
import com.smartreplyai.branch.dto.UpdateBranchRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.business.BusinessService;
import com.smartreplyai.business.onboarding.ApplyTemplateRequest;
import com.smartreplyai.business.onboarding.BusinessOnboardingService;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.knowledgebase.KnowledgeArticleRepository;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.servicecatalog.ServiceCatalogService;
import com.smartreplyai.servicecatalog.dto.CreateServiceItemRequest;
import com.smartreplyai.servicecatalog.dto.UpdateServiceItemRequest;
import com.smartreplyai.staff.*;
import com.smartreplyai.staff.dto.CreateStaffLeaveRequest;
import com.smartreplyai.staff.dto.CreateStaffRequest;
import com.smartreplyai.staff.dto.SaveStaffAvailabilityRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogAndOnboardingTest {

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
    private UserRepository userRepository;

    @Mock
    private KnowledgeArticleRepository articleRepository;

    @Mock
    private com.smartreplyai.subscription.PlanLimitService planLimitService;

    private BranchService branchService;
    private ServiceCatalogService serviceCatalogService;
    private StaffService staffService;
    private BusinessOnboardingService onboardingService;
    private BusinessService businessService;

    private Business testBusiness;
    private UUID businessId;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        testBusiness = new Business("Glamour Hair Studio", "glamour-hair", "Salon", "info@glamour.com", "9876543210");
        testBusiness.setId(businessId);
        testBusiness.setIndustryType("SALON");

        branchService = new BranchService(branchRepository, businessRepository);
        serviceCatalogService = new ServiceCatalogService(serviceItemRepository, businessRepository, branchRepository);
        staffService = new StaffService(staffRepository, businessRepository, branchRepository, userRepository,
                serviceItemRepository, staffServiceMappingRepository, staffAvailabilityRepository, staffLeaveRepository,
                planLimitService);
        onboardingService = new BusinessOnboardingService(businessRepository, branchRepository,
                serviceItemRepository, staffRepository, staffServiceMappingRepository, staffAvailabilityRepository);
        businessService = new BusinessService(businessRepository, articleRepository,
                branchRepository, serviceItemRepository, staffRepository);
    }

    // --- Branch Tests ---

    @Test
    @DisplayName("Branch: Should create a new branch successfully")
    void testCreateBranch_Success() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(branchRepository.existsByBusinessIdAndName(businessId, "Downtown Branch")).thenReturn(false);

        Branch savedBranch = new Branch(testBusiness, "Downtown Branch", "123 High Street", "9876543210", "Asia/Kolkata");
        savedBranch.setId(UUID.randomUUID());
        when(branchRepository.save(any(Branch.class))).thenReturn(savedBranch);

        CreateBranchRequest request = new CreateBranchRequest("Downtown Branch", "123 High Street", "9876543210", "Asia/Kolkata");
        var result = branchService.createBranch(businessId, request);

        assertNotNull(result);
        assertEquals("Downtown Branch", result.getName());
        assertEquals("Asia/Kolkata", result.getTimezone());
        verify(branchRepository, times(1)).save(any(Branch.class));
    }

    @Test
    @DisplayName("Branch: Should reject duplicate branch name in same business")
    void testCreateBranch_DuplicateName_ThrowsBadRequest() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(branchRepository.existsByBusinessIdAndName(businessId, "Existing Branch")).thenReturn(true);

        CreateBranchRequest request = new CreateBranchRequest("Existing Branch", null, null, null);
        assertThrows(BadRequestException.class, () -> branchService.createBranch(businessId, request));
    }

    @Test
    @DisplayName("Branch: Should update branch details")
    void testUpdateBranch_Success() {
        UUID branchId = UUID.randomUUID();
        Branch existing = new Branch(testBusiness, "Old Name", "Old Address", "111", "Asia/Kolkata");
        existing.setId(branchId);

        when(branchRepository.findByBusinessIdAndId(businessId, branchId)).thenReturn(Optional.of(existing));
        when(branchRepository.save(any(Branch.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateBranchRequest request = new UpdateBranchRequest();
        request.setName("New Name");
        request.setAddress("New Address");

        var result = branchService.updateBranch(businessId, branchId, request);
        assertEquals("New Name", result.getName());
        assertEquals("New Address", result.getAddress());
    }

    // --- Service Catalog Tests ---

    @Test
    @DisplayName("Service Catalog: Should create service item with pricing and duration")
    void testCreateServiceItem_Success() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        ServiceItem saved = new ServiceItem(testBusiness, null, "Keratin Hair Treatment", "Hair Care", 90, new BigDecimal("2500"));
        saved.setId(UUID.randomUUID());
        when(serviceItemRepository.save(any(ServiceItem.class))).thenReturn(saved);

        CreateServiceItemRequest request = new CreateServiceItemRequest();
        request.setName("Keratin Hair Treatment");
        request.setCategory("Hair Care");
        request.setDurationMinutes(90);
        request.setPrice(new BigDecimal("2500"));

        var result = serviceCatalogService.createService(businessId, request);
        assertNotNull(result);
        assertEquals("Keratin Hair Treatment", result.getName());
        assertEquals(90, result.getDurationMinutes());
        assertEquals(new BigDecimal("2500"), result.getPrice());
    }

    @Test
    @DisplayName("Service Catalog: Should retrieve distinct categories")
    void testGetCategories() {
        when(serviceItemRepository.findDistinctCategoriesByBusinessId(businessId))
                .thenReturn(List.of("Hair Care", "Skin & Facial", "Spa"));

        var categories = serviceCatalogService.getCategories(businessId);
        assertEquals(3, categories.size());
        assertTrue(categories.contains("Hair Care"));
    }

    // --- Staff Management Tests ---

    @Test
    @DisplayName("Staff: Should create staff member and auto-initialize Monday-Saturday schedule")
    void testCreateStaff_WithDefaultAvailability() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));

        Staff savedStaff = new Staff(testBusiness, null, "John Doe", "STYLIST", "9876543210", "john@example.com");
        savedStaff.setId(UUID.randomUUID());
        when(staffRepository.save(any(Staff.class))).thenReturn(savedStaff);

        CreateStaffRequest request = new CreateStaffRequest();
        request.setName("John Doe");
        request.setStaffType("STYLIST");
        request.setPhone("9876543210");
        request.setEmail("john@example.com");

        var result = staffService.createStaff(businessId, request);
        assertNotNull(result);
        assertEquals("John Doe", result.getName());
        assertEquals("STYLIST", result.getStaffType());

        // Verify Monday to Saturday (6 days) availability records saved
        verify(staffAvailabilityRepository, times(6)).save(any(StaffAvailability.class));
    }

    @Test
    @DisplayName("Staff: Should assign services to staff")
    void testAssignServicesToStaff() {
        UUID staffId = UUID.randomUUID();
        Staff staff = new Staff(testBusiness, null, "Jane", "STYLIST", "111", null);
        staff.setId(staffId);
        when(staffRepository.findByBusinessIdAndId(businessId, staffId)).thenReturn(Optional.of(staff));

        UUID serviceId1 = UUID.randomUUID();
        UUID serviceId2 = UUID.randomUUID();
        ServiceItem s1 = new ServiceItem(testBusiness, null, "Haircut", "Hair", 30, BigDecimal.TEN);
        s1.setId(serviceId1);
        ServiceItem s2 = new ServiceItem(testBusiness, null, "Facial", "Skin", 45, BigDecimal.valueOf(20));
        s2.setId(serviceId2);

        when(serviceItemRepository.findByBusinessIdAndId(businessId, serviceId1)).thenReturn(Optional.of(s1));
        when(serviceItemRepository.findByBusinessIdAndId(businessId, serviceId2)).thenReturn(Optional.of(s2));

        var assigned = staffService.assignServices(businessId, staffId, List.of(serviceId1, serviceId2));

        assertEquals(2, assigned.size());
        verify(staffServiceMappingRepository, times(1)).deleteByBusinessIdAndStaffId(businessId, staffId);
        verify(staffServiceMappingRepository, times(2)).save(any(StaffServiceMapping.class));
    }

    @Test
    @DisplayName("Staff: Should save custom availability schedule")
    void testSaveStaffAvailability() {
        UUID staffId = UUID.randomUUID();
        Staff staff = new Staff(testBusiness, null, "Dr. Smith", "DOCTOR", "111", null);
        staff.setId(staffId);
        when(staffRepository.findByBusinessIdAndId(businessId, staffId)).thenReturn(Optional.of(staff));

        List<SaveStaffAvailabilityRequest> reqs = List.of(
                new SaveStaffAvailabilityRequest(1, "10:00", "16:00", "13:00", "14:00", true)
        );

        when(staffAvailabilityRepository.findByBusinessIdAndStaffIdAndDayOfWeek(businessId, staffId, 1))
                .thenReturn(Optional.empty());

        staffService.saveStaffAvailability(businessId, staffId, reqs);
        verify(staffAvailabilityRepository, times(1)).save(any(StaffAvailability.class));
    }

    @Test
    @DisplayName("Staff Leave: Should reject duplicate leave request on same date")
    void testStaffLeave_DuplicateDate_ThrowsBadRequest() {
        UUID staffId = UUID.randomUUID();
        Staff staff = new Staff(testBusiness, null, "Dr. Smith", "DOCTOR", "111", null);
        staff.setId(staffId);
        when(staffRepository.findByBusinessIdAndId(businessId, staffId)).thenReturn(Optional.of(staff));

        LocalDate date = LocalDate.of(2026, 11, 15);
        when(staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(businessId, staffId, date, "APPROVED"))
                .thenReturn(true);

        CreateStaffLeaveRequest req = new CreateStaffLeaveRequest(date, "Conference");
        assertThrows(BadRequestException.class, () -> staffService.createStaffLeave(businessId, staffId, req));
    }

    // --- Onboarding Industry Presets Tests ---

    @Test
    @DisplayName("Onboarding: Applying SALON template provisions salon branch, services, and staff")
    void testApplyTemplate_Salon() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(branchRepository.findByBusinessId(businessId)).thenReturn(Collections.emptyList());

        Branch savedBranch = new Branch(testBusiness, "Main Studio", null, null, "Asia/Kolkata");
        savedBranch.setId(UUID.randomUUID());
        when(branchRepository.save(any(Branch.class))).thenReturn(savedBranch);

        when(serviceItemRepository.save(any(ServiceItem.class))).thenAnswer(i -> {
            ServiceItem item = i.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });

        when(staffRepository.save(any(Staff.class))).thenAnswer(i -> {
            Staff s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        ApplyTemplateRequest req = new ApplyTemplateRequest("SALON");
        var result = onboardingService.applyTemplate(businessId, req);

        assertNotNull(result);
        assertEquals("SALON", result.get("industryType"));
        assertEquals(5, result.get("servicesCreated"));
        assertEquals(2, result.get("staffCreated"));
        assertTrue((Boolean) result.get("onboardingCompleted"));
        assertEquals("SALON", testBusiness.getIndustryType());
        assertTrue(testBusiness.isOnboardingCompleted());
    }

    @Test
    @DisplayName("Onboarding: Applying DENTAL_CLINIC template provisions dental services and dentist")
    void testApplyTemplate_DentalClinic() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(branchRepository.findByBusinessId(businessId)).thenReturn(Collections.emptyList());

        Branch savedBranch = new Branch(testBusiness, "Main Dental Clinic", null, null, "Asia/Kolkata");
        savedBranch.setId(UUID.randomUUID());
        when(branchRepository.save(any(Branch.class))).thenReturn(savedBranch);

        when(serviceItemRepository.save(any(ServiceItem.class))).thenAnswer(i -> {
            ServiceItem item = i.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });

        when(staffRepository.save(any(Staff.class))).thenAnswer(i -> {
            Staff s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        ApplyTemplateRequest req = new ApplyTemplateRequest("DENTAL_CLINIC");
        var result = onboardingService.applyTemplate(businessId, req);

        assertEquals("DENTAL_CLINIC", result.get("industryType"));
        assertEquals(5, result.get("servicesCreated"));
        assertEquals(2, result.get("staffCreated"));
    }

    // --- Setup Checklist Test ---

    @Test
    @DisplayName("Checklist: Correctly reflects branch, service, and staff setup metrics")
    void testGetSetupChecklist() {
        testBusiness.setDescription("Premier salon in city");
        testBusiness.setPhone("9876543210");
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(articleRepository.countByBusinessId(businessId)).thenReturn(3L);
        when(branchRepository.countByBusinessId(businessId)).thenReturn(1L);
        when(serviceItemRepository.countByBusinessId(businessId)).thenReturn(5L);
        when(staffRepository.countByBusinessId(businessId)).thenReturn(2L);

        var checklist = businessService.getSetupChecklist(businessId);

        assertTrue((Boolean) checklist.get("profileCompleted"));
        assertTrue((Boolean) checklist.get("faqAdded"));
        assertTrue((Boolean) checklist.get("branchAdded"));
        assertTrue((Boolean) checklist.get("serviceAdded"));
        assertTrue((Boolean) checklist.get("staffAdded"));
        assertEquals("SALON", checklist.get("industryType"));
        assertTrue((Boolean) checklist.get("allCompleted"));
    }
}
