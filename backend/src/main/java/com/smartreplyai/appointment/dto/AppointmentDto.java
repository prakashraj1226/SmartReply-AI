package com.smartreplyai.appointment.dto;

import com.smartreplyai.appointment.Appointment;
import java.time.Instant;
import java.util.UUID;

public class AppointmentDto {

    private UUID id;
    private UUID customerId;
    private String customerName;
    private String customerPhone;
    private UUID branchId;
    private String branchName;
    private UUID serviceId;
    private String serviceName;
    private UUID staffId;
    private String staffName;
    private Instant startTime;
    private Instant endTime;
    private String status;
    private String bookingSource;
    private UUID createdByUserId;
    private String createdByName;
    private String notes;
    private Instant createdAt;

    public AppointmentDto() {
    }

    public static AppointmentDto fromEntity(Appointment a) {
        AppointmentDto dto = new AppointmentDto();
        dto.setId(a.getId());
        if (a.getCustomer() != null) {
            dto.setCustomerId(a.getCustomer().getId());
            dto.setCustomerName(a.getCustomer().getName());
            dto.setCustomerPhone(a.getCustomer().getPhoneNumber());
        }
        if (a.getBranch() != null) {
            dto.setBranchId(a.getBranch().getId());
            dto.setBranchName(a.getBranch().getName());
        }
        if (a.getServiceItem() != null) {
            dto.setServiceId(a.getServiceItem().getId());
        }
        if (a.getStaff() != null) {
            dto.setStaffId(a.getStaff().getId());
        }
        if (a.getCreatedBy() != null) {
            dto.setCreatedByUserId(a.getCreatedBy().getId());
            dto.setCreatedByName(a.getCreatedBy().getFullName());
        }
        dto.setServiceName(a.getServiceName());
        dto.setStaffName(a.getStaffName());
        dto.setStartTime(a.getStartTime());
        dto.setEndTime(a.getEndTime());
        dto.setStatus(a.getStatus());
        dto.setBookingSource(a.getBookingSource());
        dto.setNotes(a.getNotes());
        dto.setCreatedAt(a.getCreatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
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

    public UUID getServiceId() {
        return serviceId;
    }

    public void setServiceId(UUID serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public UUID getStaffId() {
        return staffId;
    }

    public void setStaffId(UUID staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getBookingSource() {
        return bookingSource;
    }

    public void setBookingSource(String bookingSource) {
        this.bookingSource = bookingSource;
    }

    public UUID getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(UUID createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
