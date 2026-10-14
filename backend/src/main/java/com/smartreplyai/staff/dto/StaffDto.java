package com.smartreplyai.staff.dto;

import com.smartreplyai.staff.Staff;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StaffDto {

    private UUID id;
    private UUID businessId;
    private UUID userId;
    private UUID branchId;
    private String branchName;
    private String name;
    private String staffType;
    private String phone;
    private String email;
    private boolean isActive;
    private List<AssignedServiceSummary> assignedServices = new ArrayList<>();
    private Instant createdAt;

    public static class AssignedServiceSummary {
        private UUID id;
        private String name;
        private String category;

        public AssignedServiceSummary() {
        }

        public AssignedServiceSummary(UUID id, String name, String category) {
            this.id = id;
            this.name = name;
            this.category = category;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }
    }

    public StaffDto() {
    }

    public static StaffDto fromEntity(Staff s) {
        StaffDto dto = new StaffDto();
        dto.setId(s.getId());
        dto.setBusinessId(s.getBusiness().getId());
        if (s.getUser() != null) {
            dto.setUserId(s.getUser().getId());
        }
        if (s.getBranch() != null) {
            dto.setBranchId(s.getBranch().getId());
            dto.setBranchName(s.getBranch().getName());
        }
        dto.setName(s.getName());
        dto.setStaffType(s.getStaffType());
        dto.setPhone(s.getPhone());
        dto.setEmail(s.getEmail());
        dto.setActive(s.isActive());
        dto.setCreatedAt(s.getCreatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBusinessId() {
        return businessId;
    }

    public void setBusinessId(UUID businessId) {
        this.businessId = businessId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStaffType() {
        return staffType;
    }

    public void setStaffType(String staffType) {
        this.staffType = staffType;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public List<AssignedServiceSummary> getAssignedServices() {
        return assignedServices;
    }

    public void setAssignedServices(List<AssignedServiceSummary> assignedServices) {
        this.assignedServices = assignedServices;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
