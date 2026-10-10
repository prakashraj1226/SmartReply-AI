package com.smartreplyai.appointment;

import com.smartreplyai.appointment.dto.AppointmentDto;
import com.smartreplyai.appointment.dto.CreateAppointmentRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

        customer = new Customer(business, "+919876500111", "Meera Joshi", "meera@example.com");
        customer.setId(UUID.randomUUID());
    }

    @Test
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
    void testCreateAppointment_WhenEndTimeBeforeStartTime_ThrowsBadRequest() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.minus(30, ChronoUnit.MINUTES);

        CreateAppointmentRequest req = new CreateAppointmentRequest(
                customer.getId(), "Consultation", null, start, end, null
        );

        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(customerRepository.findByBusinessIdAndId(businessId, customer.getId())).thenReturn(Optional.of(customer));

        assertThrows(BadRequestException.class, () ->
                appointmentService.createAppointment(businessId, req)
        );
    }
}
