package com.smartreplyai.staff;

import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.servicecatalog.ServiceItem;
import com.smartreplyai.servicecatalog.ServiceItemRepository;
import com.smartreplyai.servicecatalog.dto.ServiceItemDto;
import com.smartreplyai.staff.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final BusinessRepository businessRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final StaffServiceMappingRepository staffServiceMappingRepository;
    private final StaffAvailabilityRepository staffAvailabilityRepository;
    private final StaffLeaveRepository staffLeaveRepository;
    private final com.smartreplyai.subscription.PlanLimitService planLimitService;

    public StaffService(StaffRepository staffRepository,
                        BusinessRepository businessRepository,
                        BranchRepository branchRepository,
                        UserRepository userRepository,
                        ServiceItemRepository serviceItemRepository,
                        StaffServiceMappingRepository staffServiceMappingRepository,
                        StaffAvailabilityRepository staffAvailabilityRepository,
                        StaffLeaveRepository staffLeaveRepository,
                        com.smartreplyai.subscription.PlanLimitService planLimitService) {
        this.staffRepository = staffRepository;
        this.businessRepository = businessRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffServiceMappingRepository = staffServiceMappingRepository;
        this.staffAvailabilityRepository = staffAvailabilityRepository;
        this.staffLeaveRepository = staffLeaveRepository;
        this.planLimitService = planLimitService;
    }

    @Transactional(readOnly = true)
    public List<StaffDto> getStaff(UUID businessId, UUID branchId, String staffType, UUID serviceId, Boolean activeOnly) {
        List<Staff> staffList;
        boolean onlyActive = activeOnly == null || activeOnly;

        if (serviceId != null) {
            staffList = staffServiceMappingRepository.findEligibleStaffForService(businessId, serviceId);
            if (onlyActive) {
                staffList = staffList.stream().filter(Staff::isActive).collect(Collectors.toList());
            }
        } else if (branchId != null) {
            staffList = onlyActive
                    ? staffRepository.findByBusinessIdAndBranchIdAndIsActiveTrue(businessId, branchId)
                    : staffRepository.findByBusinessIdAndBranchId(businessId, branchId);
        } else if (staffType != null && !staffType.isBlank()) {
            staffList = onlyActive
                    ? staffRepository.findByBusinessIdAndStaffTypeAndIsActiveTrue(businessId, staffType.trim().toUpperCase())
                    : staffRepository.findByBusinessIdAndStaffType(businessId, staffType.trim().toUpperCase());
        } else {
            staffList = onlyActive
                    ? staffRepository.findByBusinessIdAndIsActiveTrue(businessId)
                    : staffRepository.findByBusinessId(businessId);
        }

        return staffList.stream().map(s -> populateStaffDto(businessId, s)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StaffDto getStaffById(UUID businessId, UUID staffId) {
        Staff staff = staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));
        return populateStaffDto(businessId, staff);
    }

    @Transactional
    public StaffDto createStaff(UUID businessId, CreateStaffRequest request) {
        planLimitService.checkStaffLimit(businessId);

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findByBusinessIdAndId(businessId, request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + request.getBranchId()));
        }

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
        }

        Staff staff = new Staff(
                business,
                branch,
                request.getName().trim(),
                request.getStaffType() != null && !request.getStaffType().isBlank() ? request.getStaffType().trim().toUpperCase() : "STAFF",
                request.getPhone() != null ? request.getPhone().trim() : null,
                request.getEmail() != null ? request.getEmail().trim() : null
        );
        staff.setUser(user);
        staff = staffRepository.save(staff);

        // Map initial services if provided
        if (request.getServiceIds() != null && !request.getServiceIds().isEmpty()) {
            for (UUID sId : request.getServiceIds()) {
                Optional<ServiceItem> serviceOpt = serviceItemRepository.findByBusinessIdAndId(businessId, sId);
                if (serviceOpt.isPresent()) {
                    StaffServiceMapping mapping = new StaffServiceMapping(business, staff, serviceOpt.get());
                    staffServiceMappingRepository.save(mapping);
                }
            }
        }

        // Set default availability: Monday to Saturday 09:00 - 18:00
        initDefaultAvailability(business, staff, branch);

        return populateStaffDto(businessId, staff);
    }

    @Transactional
    public StaffDto updateStaff(UUID businessId, UUID staffId, UpdateStaffRequest request) {
        Staff staff = staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findByBusinessIdAndId(businessId, request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + request.getBranchId()));
            staff.setBranch(branch);
        }
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
            staff.setUser(user);
        }
        if (request.getName() != null && !request.getName().isBlank()) {
            staff.setName(request.getName().trim());
        }
        if (request.getStaffType() != null && !request.getStaffType().isBlank()) {
            staff.setStaffType(request.getStaffType().trim().toUpperCase());
        }
        if (request.getPhone() != null) {
            staff.setPhone(request.getPhone().trim());
        }
        if (request.getEmail() != null) {
            staff.setEmail(request.getEmail().trim());
        }
        if (request.getIsActive() != null) {
            staff.setActive(request.getIsActive());
        }

        staff = staffRepository.save(staff);
        return populateStaffDto(businessId, staff);
    }

    @Transactional
    public void deactivateStaff(UUID businessId, UUID staffId) {
        Staff staff = staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));
        staff.setActive(false);
        staffRepository.save(staff);
    }

    // --- Service Assignments ---

    @Transactional(readOnly = true)
    public List<ServiceItemDto> getAssignedServices(UUID businessId, UUID staffId) {
        // verify staff belongs to business
        staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));

        List<StaffServiceMapping> mappings = staffServiceMappingRepository.findByBusinessIdAndStaffId(businessId, staffId);
        return mappings.stream()
                .map(m -> ServiceItemDto.fromEntity(m.getServiceItem()))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ServiceItemDto> assignServices(UUID businessId, UUID staffId, List<UUID> serviceIds) {
        Staff staff = staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));
        Business business = staff.getBusiness();

        // Remove existing mappings
        staffServiceMappingRepository.deleteByBusinessIdAndStaffId(businessId, staffId);

        List<ServiceItemDto> assigned = new ArrayList<>();
        if (serviceIds != null) {
            for (UUID sId : serviceIds) {
                ServiceItem service = serviceItemRepository.findByBusinessIdAndId(businessId, sId)
                        .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + sId));
                StaffServiceMapping mapping = new StaffServiceMapping(business, staff, service);
                staffServiceMappingRepository.save(mapping);
                assigned.add(ServiceItemDto.fromEntity(service));
            }
        }
        return assigned;
    }

    @Transactional(readOnly = true)
    public List<StaffDto> getEligibleStaffForService(UUID businessId, UUID serviceId) {
        serviceItemRepository.findByBusinessIdAndId(businessId, serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + serviceId));

        List<Staff> staffList = staffServiceMappingRepository.findEligibleStaffForService(businessId, serviceId);
        return staffList.stream().map(s -> populateStaffDto(businessId, s)).collect(Collectors.toList());
    }

    // --- Availability Management ---

    @Transactional(readOnly = true)
    public List<StaffAvailabilityDto> getStaffAvailability(UUID businessId, UUID staffId) {
        staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));

        List<StaffAvailability> availabilities = staffAvailabilityRepository.findByBusinessIdAndStaffId(businessId, staffId);
        return availabilities.stream()
                .sorted((a, b) -> Integer.compare(a.getDayOfWeek(), b.getDayOfWeek()))
                .map(StaffAvailabilityDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<StaffAvailabilityDto> saveStaffAvailability(UUID businessId, UUID staffId, List<SaveStaffAvailabilityRequest> requests) {
        Staff staff = staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));
        Business business = staff.getBusiness();

        for (SaveStaffAvailabilityRequest req : requests) {
            if (req.getDayOfWeek() < 1 || req.getDayOfWeek() > 7) {
                throw new BadRequestException("Day of week must be between 1 (Monday) and 7 (Sunday)");
            }

            LocalTime start = LocalTime.parse(req.getStartTime());
            LocalTime end = LocalTime.parse(req.getEndTime());
            LocalTime breakStart = (req.getBreakStartTime() != null && !req.getBreakStartTime().isBlank())
                    ? LocalTime.parse(req.getBreakStartTime()) : null;
            LocalTime breakEnd = (req.getBreakEndTime() != null && !req.getBreakEndTime().isBlank())
                    ? LocalTime.parse(req.getBreakEndTime()) : null;

            Optional<StaffAvailability> existingOpt = staffAvailabilityRepository
                    .findByBusinessIdAndStaffIdAndDayOfWeek(businessId, staffId, req.getDayOfWeek());

            StaffAvailability availability;
            if (existingOpt.isPresent()) {
                availability = existingOpt.get();
                availability.setStartTime(start);
                availability.setEndTime(end);
                availability.setBreakStartTime(breakStart);
                availability.setBreakEndTime(breakEnd);
                availability.setActive(req.getIsActive() != null ? req.getIsActive() : true);
            } else {
                availability = new StaffAvailability(
                        business, staff, staff.getBranch(), req.getDayOfWeek(),
                        start, end, breakStart, breakEnd
                );
                availability.setActive(req.getIsActive() != null ? req.getIsActive() : true);
            }
            staffAvailabilityRepository.save(availability);
        }

        return getStaffAvailability(businessId, staffId);
    }

    // --- Leave Management ---

    @Transactional(readOnly = true)
    public List<StaffLeaveDto> getStaffLeaves(UUID businessId, UUID staffId) {
        staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));

        List<StaffLeave> leaves = staffLeaveRepository.findByBusinessIdAndStaffId(businessId, staffId);
        return leaves.stream().map(StaffLeaveDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public StaffLeaveDto createStaffLeave(UUID businessId, UUID staffId, CreateStaffLeaveRequest request) {
        Staff staff = staffRepository.findByBusinessIdAndId(businessId, staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with ID: " + staffId));

        boolean alreadyOnLeave = staffLeaveRepository.existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(
                businessId, staffId, request.getLeaveDate(), "APPROVED"
        );
        if (alreadyOnLeave) {
            throw new BadRequestException("Staff is already on approved leave for " + request.getLeaveDate());
        }

        StaffLeave leave = new StaffLeave(
                staff.getBusiness(),
                staff,
                request.getLeaveDate(),
                request.getReason() != null ? request.getReason().trim() : "Scheduled Leave"
        );

        leave = staffLeaveRepository.save(leave);
        return StaffLeaveDto.fromEntity(leave);
    }

    @Transactional
    public void cancelStaffLeave(UUID businessId, UUID staffId, UUID leaveId) {
        StaffLeave leave = staffLeaveRepository.findByBusinessIdAndId(businessId, leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave record not found with ID: " + leaveId));

        if (!leave.getStaff().getId().equals(staffId)) {
            throw new BadRequestException("Leave does not belong to the specified staff member");
        }

        leave.setStatus("CANCELLED");
        staffLeaveRepository.save(leave);
    }

    // --- Helper Methods ---

    private StaffDto populateStaffDto(UUID businessId, Staff staff) {
        StaffDto dto = StaffDto.fromEntity(staff);
        List<StaffServiceMapping> mappings = staffServiceMappingRepository.findByBusinessIdAndStaffId(businessId, staff.getId());
        List<StaffDto.AssignedServiceSummary> services = mappings.stream()
                .map(m -> new StaffDto.AssignedServiceSummary(
                        m.getServiceItem().getId(),
                        m.getServiceItem().getName(),
                        m.getServiceItem().getCategory()
                ))
                .collect(Collectors.toList());
        dto.setAssignedServices(services);
        return dto;
    }

    private void initDefaultAvailability(Business business, Staff staff, Branch branch) {
        // Monday (1) to Saturday (6): 09:00 - 18:00, lunch 13:00 - 14:00
        for (int day = 1; day <= 6; day++) {
            StaffAvailability a = new StaffAvailability(
                    business, staff, branch, day,
                    LocalTime.of(9, 0), LocalTime.of(18, 0),
                    LocalTime.of(13, 0), LocalTime.of(14, 0)
            );
            staffAvailabilityRepository.save(a);
        }
    }
}
