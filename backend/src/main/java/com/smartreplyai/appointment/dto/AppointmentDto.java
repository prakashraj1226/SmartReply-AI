package com.smartreplyai.appointment.dto;

import com.smartreplyai.appointment.Appointment;
import java.time.Instant;
import java.util.UUID;

public class AppointmentDto {

    private UUID id;
    private UUID customerId;
    private String customerName;
    private String customerPhone;
    private String serviceName;
    private String staffName;
    private Instant startTime;
    private Instant endTime;
    private String status;
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
        dto.setServiceName(a.getServiceName());
        dto.setStaffName(a.getStaffName());
        dto.setStartTime(a.getStartTime());
        dto.setEndTime(a.getEndTime());
        dto.setStatus(a.getStatus());
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

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
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
