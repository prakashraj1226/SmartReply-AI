package com.smartreplyai.appointment;

import com.smartreplyai.appointment.dto.AppointmentDto;
import com.smartreplyai.appointment.dto.CreateAppointmentRequest;
import com.smartreplyai.appointment.dto.TimeSlotDto;
import com.smartreplyai.appointment.dto.UpdateAppointmentStatusRequest;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.security.TenantSecurityService;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.staff.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private CustomerRepository customerRepository;

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
    private TenantSecurityService tenantSecurityService;

    @InjectMocks
    private AppointmentService appointmentService;

    private UUID businessId;
    private Business business;
    private Customer customer;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        business = new Business("SmileCare Dental", "smilecare", "CLINIC", "care@smilecare.com", "+919876543210");
        business.setId(businessId);
        business.setTimezone("Asia/Kolkata");

        customer = new Customer(business, "Meera Joshi", "+919876500111", "meera@example.com");
        customer.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Create appointment with customer ID and valid slot")
    void testCreateAppointment_Success() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);

        CreateAppointmentRequest req = new CreateAppointmentRequest(
                customer.getId(), "Dental Scaling & Polishing", "Dr. Rajesh Gupta", start, end, "Routine check"
        );

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(customerRepository.findByBusinessIdAndId(businessId, customer.getId())).thenReturn(Optional.of(customer));
        when(appointmentRepository.countConflictingAppointments(eq(businessId), isNull(), eq("Dr. Rajesh Gupta"), eq(start), eq(end)))
                .thenReturn(0L);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AppointmentDto result = appointmentService.createAppointment(businessId, req);

        assertNotNull(result);
        assertEquals("Dental Scaling & Polishing", result.getServiceName());
        assertEquals("Dr. Rajesh Gupta", result.getStaffName());
        assertEquals("CONFIRMED", result.getStatus());
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Reject booking when conflicting appointment exists")
    void testCreateAppointment_WhenConflictingBookingExists_ThrowsBadRequest() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(1, ChronoUnit.HOURS);

        CreateAppointmentRequest req = new CreateAppointmentRequest(
                customer.getId(), "Root Canal Treatment", "Dr. Rajesh Gupta", start, end, "Urgent"
        );

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(customerRepository.findByBusinessIdAndId(businessId, customer.getId())).thenReturn(Optional.of(customer));
        when(appointmentRepository.countConflictingAppointments(eq(businessId), isNull(), eq("Dr. Rajesh Gupta"), eq(start), eq(end)))
                .thenReturn(1L);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                appointmentService.createAppointment(businessId, req)
        );

        assertTrue(ex.getMessage().contains("already booked"));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Auto-create customer by phone if customer ID is not passed")
    void testCreateAppointment_AutoCreatesCustomerByPhone() {
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(45, ChronoUnit.MINUTES);

        CreateAppointmentRequest req = new CreateAppointmentRequest();
        req.setCustomerPhone("+919999888777");
        req.setCustomerName("New Customer");
        req.setServiceName("Haircut");
        req.setStartTime(start);
        req.setEndTime(end);

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(customerRepository.findByBusinessIdAndPhoneNumber(businessId, "+919999888777")).thenReturn(Optional.empty());

        Customer createdCust = new Customer(business, "+919999888777", "New Customer", null);
        createdCust.setId(UUID.randomUUID());
        when(customerRepository.save(any(Customer.class))).thenReturn(createdCust);

        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AppointmentDto result = appointmentService.createAppointment(businessId, req);
        assertNotNull(result);
        assertEquals("New Customer", result.getCustomerName());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("Compute available slots considering working shift and break times")
    void testGetAvailableSlots_ComputesFreeSlotsExcludingBreak() {
        LocalDate date = LocalDate.now().plusDays(2);
        UUID staffId = UUID.randomUUID();

        Staff staff = new Staff(business, null, "Dr. Dentist", "DENTIST", "111", null);
        staff.setId(staffId);
        staff.setActive(true);

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(staffRepository.findByBusinessIdAndId(businessId, staffId)).thenReturn(Optional.of(staff));
        when(staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(businessId, staffId, date, "APPROVED"))
                .thenReturn(false);

        // Monday-Saturday shift: 09:00 - 12:00, lunch 10:00 - 11:00
        StaffAvailability avail = new StaffAvailability(
                business, staff, null, date.getDayOfWeek().getValue(),
                LocalTime.of(9, 0), LocalTime.of(12, 0),
                LocalTime.of(10, 0), LocalTime.of(11, 0)
        );
        when(staffAvailabilityRepository.findByBusinessIdAndStaffIdAndDayOfWeek(businessId, staffId, date.getDayOfWeek().getValue()))
                .thenReturn(Optional.of(avail));

        when(appointmentRepository.findActiveAppointmentsInRange(eq(businessId), isNull(), eq(staffId), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        List<TimeSlotDto> slots = appointmentService.getAvailableSlots(businessId, null, null, staffId, date);

        assertNotNull(slots);
        assertFalse(slots.isEmpty());
        // Verify no slot falls inside lunch break (10:00 to 11:00)
        for (TimeSlotDto slot : slots) {
            assertFalse(slot.getTimeFormatted().startsWith("10:"),
                    "Slot " + slot.getTimeFormatted() + " should not overlap lunch break");
        }
    }

    @Test
    @DisplayName("Compute available slots skips staff on approved leave")
    void testGetAvailableSlots_WhenStaffOnLeave_ReturnsEmpty() {
        LocalDate date = LocalDate.now().plusDays(3);
        UUID staffId = UUID.randomUUID();

        Staff staff = new Staff(business, null, "Dr. Vacation", "DOCTOR", "111", null);
        staff.setId(staffId);
        staff.setActive(true);

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(staffRepository.findByBusinessIdAndId(businessId, staffId)).thenReturn(Optional.of(staff));
        when(staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(businessId, staffId, date, "APPROVED"))
                .thenReturn(true);

        List<TimeSlotDto> slots = appointmentService.getAvailableSlots(businessId, null, null, staffId, date);
        assertTrue(slots.isEmpty(), "Should return empty slots when practitioner is on approved leave");
    }

    @Test
    @DisplayName("Update appointment status through workflow")
    void testUpdateAppointmentStatus_Success() {
        UUID appId = UUID.randomUUID();
        Appointment a = new Appointment(business, customer, "Consultation", "Doctor",
                Instant.now(), Instant.now().plus(30, ChronoUnit.MINUTES), "CONFIRMED", "Notes");
        a.setId(appId);

        when(appointmentRepository.findByBusinessIdAndId(businessId, appId)).thenReturn(Optional.of(a));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest("CHECKED_IN");
        AppointmentDto result = appointmentService.updateAppointmentStatus(businessId, appId, req);

        assertEquals("CHECKED_IN", result.getStatus());
    }
}
