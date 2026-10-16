package com.smartreplyai.appointment;

import com.smartreplyai.appointment.dto.*;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.security.TenantSecurityService;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.staff.*;
import com.smartreplyai.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final BusinessRepository businessRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final StaffRepository staffRepository;
    private final StaffServiceMappingRepository staffServiceMappingRepository;
    private final StaffAvailabilityRepository staffAvailabilityRepository;
    private final StaffLeaveRepository staffLeaveRepository;
    private final UserRepository userRepository;
    private final TenantSecurityService tenantSecurityService;
    private final com.smartreplyai.subscription.PlanLimitService planLimitService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              BusinessRepository businessRepository,
                              CustomerRepository customerRepository,
                              BranchRepository branchRepository,
                              ServiceItemRepository serviceItemRepository,
                              StaffRepository staffRepository,
                              StaffServiceMappingRepository staffServiceMappingRepository,
                              StaffAvailabilityRepository staffAvailabilityRepository,
                              StaffLeaveRepository staffLeaveRepository,
                              UserRepository userRepository,
                              TenantSecurityService tenantSecurityService,
                              com.smartreplyai.subscription.PlanLimitService planLimitService) {
        this.appointmentRepository = appointmentRepository;
        this.businessRepository = businessRepository;
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffRepository = staffRepository;
        this.staffServiceMappingRepository = staffServiceMappingRepository;
        this.staffAvailabilityRepository = staffAvailabilityRepository;
        this.staffLeaveRepository = staffLeaveRepository;
        this.userRepository = userRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.planLimitService = planLimitService;
    }

    // --- Slot Computation Engine ---

    @Transactional(readOnly = true)
    public List<TimeSlotDto> getAvailableSlots(UUID businessId, UUID branchId, UUID serviceId, UUID staffId, LocalDate date) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));

        ZoneId zone;
        try {
            zone = ZoneId.of(business.getTimezone() != null ? business.getTimezone() : "Asia/Kolkata");
        } catch (Exception e) {
            zone = ZoneId.of("Asia/Kolkata");
        }

        // 1. Determine duration
        int durationMinutes = 30;
        int bufferAfterMinutes = 0;
        ServiceItem serviceItem = null;
        if (serviceId != null) {
            serviceItem = serviceItemRepository.findByBusinessIdAndId(businessId, serviceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + serviceId));
            durationMinutes = serviceItem.getDurationMinutes();
            bufferAfterMinutes = serviceItem.getBufferAfterMinutes();
        }

        int totalSlotMinutes = durationMinutes + bufferAfterMinutes;

        // 2. Determine candidate staff
        List<Staff> candidateStaff = new ArrayList<>();
        if (staffId != null) {
            Staff s = staffRepository.findByBusinessIdAndId(businessId, staffId)
                    .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));
            if (s.isActive()) {
                candidateStaff.add(s);
            }
        } else if (serviceId != null) {
            candidateStaff = staffServiceMappingRepository.findEligibleStaffForService(businessId, serviceId);
            if (candidateStaff.isEmpty()) {
                candidateStaff = staffRepository.findByBusinessIdAndIsActiveTrue(businessId);
            }
        } else {
            candidateStaff = staffRepository.findByBusinessIdAndIsActiveTrue(businessId);
        }

        if (branchId != null) {
            candidateStaff = candidateStaff.stream()
                    .filter(s -> s.getBranch() == null || s.getBranch().getId().equals(branchId))
                    .collect(Collectors.toList());
        }

        if (candidateStaff.isEmpty()) {
            return Collections.emptyList();
        }

        int dayOfWeek = date.getDayOfWeek().getValue(); // 1 = Monday, 7 = Sunday
        Instant now = Instant.now();

        // 3. Compute slots per staff member
        Map<Instant, TimeSlotDto> slotMap = new HashMap<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        for (Staff staff : candidateStaff) {
            // Check approved leave
            boolean onLeave = staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(
                    businessId, staff.getId(), date, "APPROVED"
            );
            if (onLeave) {
                continue;
            }

            // Check availability schedule
            Optional<StaffAvailability> availOpt = staffAvailabilityRepository
                    .findByBusinessIdAndStaffIdAndDayOfWeek(businessId, staff.getId(), dayOfWeek);

            LocalTime shiftStart = LocalTime.of(9, 0);
            LocalTime shiftEnd = LocalTime.of(19, 0);
            LocalTime breakStart = LocalTime.of(13, 0);
            LocalTime breakEnd = LocalTime.of(14, 0);

            if (availOpt.isPresent()) {
                StaffAvailability avail = availOpt.get();
                if (!avail.isActive()) {
                    continue; // Explicitly marked off/inactive on this day
                }
                shiftStart = avail.getStartTime() != null ? avail.getStartTime() : shiftStart;
                shiftEnd = avail.getEndTime() != null ? avail.getEndTime() : shiftEnd;
                breakStart = avail.getBreakStartTime();
                breakEnd = avail.getBreakEndTime();
            } else if (dayOfWeek == 7) {
                continue; // Sunday closed by default
            }

            // Fetch existing appointments for this staff member on this date
            ZonedDateTime dayStartZdt = date.atStartOfDay(zone);
            ZonedDateTime dayEndZdt = date.atTime(LocalTime.MAX).atZone(zone);
            List<Appointment> existingAppointments = appointmentRepository.findActiveAppointmentsInRange(
                    businessId, branchId, staff.getId(), dayStartZdt.toInstant(), dayEndZdt.toInstant()
            );

            // Step through shift in increments
            int stepMinutes = Math.min(30, durationMinutes);
            LocalTime currentSlotTime = shiftStart;

            while (!currentSlotTime.plusMinutes(totalSlotMinutes).isAfter(shiftEnd)) {
                LocalTime slotEndTime = currentSlotTime.plusMinutes(durationMinutes);

                // Check break conflict
                boolean overlapsBreak = false;
                if (breakStart != null && breakEnd != null) {
                    if (currentSlotTime.isBefore(breakEnd) && slotEndTime.isAfter(breakStart)) {
                        overlapsBreak = true;
                    }
                }

                if (!overlapsBreak) {
                    Instant slotStartInstant = date.atTime(currentSlotTime).atZone(zone).toInstant();
                    Instant slotEndInstant = date.atTime(slotEndTime).atZone(zone).toInstant();

                    // Check if slot is in the past
                    if (!slotStartInstant.isBefore(now)) {
                        // Check appointment conflict
                        boolean overlapsAppointment = existingAppointments.stream().anyMatch(a ->
                                slotStartInstant.isBefore(a.getEndTime()) && slotEndInstant.isAfter(a.getStartTime())
                        );

                        if (!overlapsAppointment) {
                            final LocalTime slotStartTime = currentSlotTime;
                            TimeSlotDto slot = slotMap.computeIfAbsent(slotStartInstant, k -> {
                                String formatted = slotStartTime.format(timeFormatter) + " - " + slotEndTime.format(timeFormatter);
                                return new TimeSlotDto(slotStartInstant, slotEndInstant, formatted, true);
                            });

                            slot.getAvailableStaff().add(new TimeSlotDto.AvailableStaffSummary(
                                    staff.getId(), staff.getName(), staff.getStaffType()
                            ));
                        }
                    }
                }

                currentSlotTime = currentSlotTime.plusMinutes(stepMinutes);
            }
        }

        return slotMap.values().stream()
                .sorted(Comparator.comparing(TimeSlotDto::getStartTime))
                .collect(Collectors.toList());
    }

    // --- Appointment Queries ---

    @Transactional(readOnly = true)
    public List<AppointmentDto> getAppointmentsByRange(UUID businessId, Instant start, Instant end) {
        return appointmentRepository
                .findByBusinessIdAndStartTimeGreaterThanEqualAndEndTimeLessThanEqualOrderByStartTimeAsc(businessId, start, end)
                .stream()
                .filter(this::canAccessAppointment)
                .map(AppointmentDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AppointmentDto> getAppointments(UUID businessId, Pageable pageable) {
        return appointmentRepository.findByBusinessIdOrderByStartTimeDesc(businessId, pageable)
                .map(AppointmentDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public AppointmentDto getAppointmentById(UUID businessId, UUID id) {
        Appointment a = appointmentRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        if (!canAccessAppointment(a)) {
            throw new ResourceNotFoundException("Appointment not found with ID: " + id);
        }
        return AppointmentDto.fromEntity(a);
    }

    // --- Booking & Modification ---

    @Transactional
    public AppointmentDto createAppointment(UUID businessId, CreateAppointmentRequest req) {
        planLimitService.checkAppointmentLimit(businessId);

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));

        // 1. Resolve Customer
        Customer customer = resolveCustomer(business, req);

        // 2. Resolve Service
        ServiceItem serviceItem = null;
        String serviceName = req.getServiceName();
        int durationMinutes = 30;

        if (req.getServiceId() != null) {
            serviceItem = serviceItemRepository.findByBusinessIdAndId(businessId, req.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + req.getServiceId()));
            serviceName = serviceItem.getName();
            durationMinutes = serviceItem.getDurationMinutes();
        }

        if (serviceName == null || serviceName.isBlank()) {
            throw new BadRequestException("Service name or valid service ID is required");
        }

        // 3. Resolve Timestamps
        Instant startTime = req.getStartTime();
        Instant endTime = req.getEndTime();
        if (endTime == null) {
            endTime = startTime.plusSeconds(durationMinutes * 60L);
        }

        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Appointment start time must be before end time");
        }

        // 4. Resolve Branch
        Branch branch = null;
        if (req.getBranchId() != null) {
            branch = branchRepository.findByBusinessIdAndId(businessId, req.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + req.getBranchId()));
        } else if (serviceItem != null && serviceItem.getBranch() != null) {
            branch = serviceItem.getBranch();
        }

        // 5. Resolve Staff
        Staff staff = null;
        String staffName = req.getStaffName();
        if (req.getStaffId() != null) {
            staff = staffRepository.findByBusinessIdAndId(businessId, req.getStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + req.getStaffId()));
            staffName = staff.getName();
            if (branch == null && staff.getBranch() != null) {
                branch = staff.getBranch();
            }
        }

        // 6. Double-booking & Conflict validation
        if (staff != null) {
            long conflicts = appointmentRepository.countConflictingStaffAppointments(
                    businessId, null, staff.getId(), startTime, endTime
            );
            if (conflicts > 0) {
                throw new BadRequestException("Selected time slot is already booked for " + staff.getName() + ". Please select another time.");
            }

            // Validate staff leave
            ZoneId zone = ZoneId.of(business.getTimezone() != null ? business.getTimezone() : "Asia/Kolkata");
            LocalDate appointmentDate = startTime.atZone(zone).toLocalDate();
            boolean onLeave = staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(
                    businessId, staff.getId(), appointmentDate, "APPROVED"
            );
            if (onLeave) {
                throw new BadRequestException(staff.getName() + " is on leave on " + appointmentDate + ". Please choose another date or staff member.");
            }
        } else if (staffName != null && !staffName.isBlank()) {
            long conflicts = appointmentRepository.countConflictingAppointments(
                    businessId, null, staffName, startTime, endTime
            );
            if (conflicts > 0) {
                throw new BadRequestException("Selected time slot is already booked with " + staffName + ". Please select another time.");
            }
        }

        // 7. Resolve Creator User
        User createdBy = null;
        UUID currentUserId = TenantContext.getUserId();
        if (currentUserId != null) {
            createdBy = userRepository.findById(currentUserId).orElse(null);
        }

        Appointment a = new Appointment(
                business, customer, serviceName, staffName,
                startTime, endTime, "CONFIRMED", req.getNotes()
        );
        a.setBranch(branch);
        a.setServiceItem(serviceItem);
        a.setStaff(staff);
        a.setBookingSource(req.getBookingSource() != null ? req.getBookingSource().toUpperCase() : "STAFF_MANUAL");
        a.setCreatedBy(createdBy);

        a = appointmentRepository.save(a);
        return AppointmentDto.fromEntity(a);
    }

    @Transactional
    public AppointmentDto updateAppointment(UUID businessId, UUID id, UpdateAppointmentRequest req) {
        Appointment a = appointmentRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        Instant newStart = req.getStartTime() != null ? req.getStartTime() : a.getStartTime();
        Instant newEnd = req.getEndTime() != null ? req.getEndTime() : a.getEndTime();
        String newStaff = req.getStaffName() != null ? req.getStaffName() : a.getStaffName();

        if (!newStart.isBefore(newEnd)) {
            throw new BadRequestException("Appointment start time must be before end time");
        }

        // Check conflicts if schedule changed
        if (!newStart.equals(a.getStartTime()) || !newEnd.equals(a.getEndTime()) || (newStaff != null && !newStaff.equals(a.getStaffName()))) {
            if (a.getStaff() != null) {
                long conflicts = appointmentRepository.countConflictingStaffAppointments(businessId, a.getId(), a.getStaff().getId(), newStart, newEnd);
                if (conflicts > 0) {
                    throw new BadRequestException("New time slot conflicts with an existing booking for " + a.getStaff().getName());
                }
            } else {
                long conflicts = appointmentRepository.countConflictingAppointments(businessId, a.getId(), newStaff, newStart, newEnd);
                if (conflicts > 0) {
                    throw new BadRequestException("New time slot conflicts with an existing booking. Please pick another time.");
                }
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
    public AppointmentDto updateAppointmentStatus(UUID businessId, UUID id, UpdateAppointmentStatusRequest req) {
        Appointment a = appointmentRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        String newStatus = req.getStatus().trim().toUpperCase();
        Set<String> validStatuses = Set.of("PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW");
        if (!validStatuses.contains(newStatus)) {
            throw new BadRequestException("Invalid status: " + newStatus + ". Valid statuses: " + validStatuses);
        }

        a.setStatus(newStatus);
        if (req.getNotes() != null && !req.getNotes().isBlank()) {
            a.setNotes(req.getNotes());
        }

        a = appointmentRepository.save(a);
        return AppointmentDto.fromEntity(a);
    }

    @Transactional
    public void cancelAppointment(UUID businessId, UUID id) {
        Appointment a = appointmentRepository.findByBusinessIdAndId(businessId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
        a.setStatus("CANCELLED");
        appointmentRepository.save(a);
    }

    // --- Helpers ---

    private Customer resolveCustomer(Business business, CreateAppointmentRequest req) {
        if (req.getCustomerId() != null) {
            return customerRepository.findByBusinessIdAndId(business.getId(), req.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + req.getCustomerId()));
        }

        if (req.getCustomerPhone() != null && !req.getCustomerPhone().isBlank()) {
            String phone = req.getCustomerPhone().trim();
            Optional<Customer> existing = customerRepository.findByBusinessIdAndPhoneNumber(business.getId(), phone);
            if (existing.isPresent()) {
                return existing.get();
            }

            String name = req.getCustomerName() != null && !req.getCustomerName().isBlank()
                    ? req.getCustomerName().trim()
                    : "Customer (" + phone + ")";

            Customer c = new Customer(business, phone, name, null);
            return customerRepository.save(c);
        }

        throw new BadRequestException("Either customerId or customerPhone is required to book an appointment");
    }

    private boolean canAccessAppointment(Appointment a) {
        if (a.getStaff() != null) {
            return tenantSecurityService.canAccessStaffAppointment(a.getStaff().getId());
        }
        return true;
    }
}
