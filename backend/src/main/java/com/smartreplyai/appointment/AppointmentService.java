package com.smartreplyai.appointment;

import com.smartreplyai.appointment.dto.AppointmentDto;
import com.smartreplyai.appointment.dto.CreateAppointmentRequest;
import com.smartreplyai.appointment.dto.UpdateAppointmentRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final BusinessRepository businessRepository;
    private final CustomerRepository customerRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              BusinessRepository businessRepository,
                              CustomerRepository customerRepository) {
        this.appointmentRepository = appointmentRepository;
        this.businessRepository = businessRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getAppointmentsByRange(UUID businessId, Instant start, Instant end) {
        return appointmentRepository
                .findByBusinessIdAndStartTimeGreaterThanEqualAndEndTimeLessThanEqualOrderByStartTimeAsc(businessId, start, end)
                .stream()
                .map(AppointmentDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<AppointmentDto> getAppointments(UUID businessId, Pageable pageable) {
        return appointmentRepository.findByBusinessIdOrderByStartTimeDesc(businessId, pageable)
                .map(AppointmentDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public AppointmentDto getAppointmentById(UUID businessId, UUID id) {
        Appointment a = appointmentRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        return AppointmentDto.fromEntity(a);
    }

    @Transactional
    public AppointmentDto createAppointment(UUID businessId, CreateAppointmentRequest req) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        Customer customer = customerRepository.findByBusinessIdAndId(businessId, req.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (!req.getStartTime().isBefore(req.getEndTime())) {
            throw new BadRequestException("Appointment start time must be before end time");
        }

        // Validate booking conflicts
        long conflicts = appointmentRepository.countConflictingAppointments(
                businessId, null, req.getStaffName(), req.getStartTime(), req.getEndTime());
        if (conflicts > 0) {
            String staffInfo = req.getStaffName() != null ? " with " + req.getStaffName() : "";
            throw new BadRequestException("Selected time slot is already booked" + staffInfo + ". Please select another time.");
        }

        Appointment a = new Appointment(
                business, customer, req.getServiceName(), req.getStaffName(),
                req.getStartTime(), req.getEndTime(), "CONFIRMED", req.getNotes()
        );

        a = appointmentRepository.save(a);
        return AppointmentDto.fromEntity(a);
    }

    @Transactional
    public AppointmentDto updateAppointment(UUID businessId, UUID id, UpdateAppointmentRequest req) {
        Appointment a = appointmentRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        Instant newStart = req.getStartTime() != null ? req.getStartTime() : a.getStartTime();
        Instant newEnd = req.getEndTime() != null ? req.getEndTime() : a.getEndTime();
        String newStaff = req.getStaffName() != null ? req.getStaffName() : a.getStaffName();

        if (!newStart.isBefore(newEnd)) {
            throw new BadRequestException("Appointment start time must be before end time");
        }

        // Check conflicts if schedule changed
        if (!newStart.equals(a.getStartTime()) || !newEnd.equals(a.getEndTime()) || (newStaff != null && !newStaff.equals(a.getStaffName()))) {
            long conflicts = appointmentRepository.countConflictingAppointments(businessId, a.getId(), newStaff, newStart, newEnd);
            if (conflicts > 0) {
                throw new BadRequestException("New time slot conflicts with an existing booking. Please pick another time.");
            }
        }

        if (req.getServiceName() != null) a.setServiceName(req.getServiceName());
        a.setStaffName(newStaff);
        a.setStartTime(newStart);
        a.setEndTime(newEnd);
        if (req.getStatus() != null) a.setStatus(req.getStatus().toUpperCase());
        if (req.getNotes() != null) a.setNotes(req.getNotes());

        a = appointmentRepository.save(a);
        return AppointmentDto.fromEntity(a);
    }

    @Transactional
    public void cancelAppointment(UUID businessId, UUID id) {
        Appointment a = appointmentRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        a.setStatus("CANCELLED");
        appointmentRepository.save(a);
    }
}
