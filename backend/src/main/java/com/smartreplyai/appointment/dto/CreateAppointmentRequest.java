package com.smartreplyai.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public class CreateAppointmentRequest {

    private UUID customerId;
    private String customerName;
    private String customerPhone;

    private UUID branchId;
    private UUID serviceId;
    private String serviceName;

    private UUID staffId;
    private String staffName;

    @NotNull(message = "Start time is required")
    private Instant startTime;

    private Instant endTime;

    private String bookingSource = "STAFF_MANUAL"; // WHATSAPP, WEB_PORTAL, STAFF_MANUAL, AI_ASSISTANT

    private String notes;

    public CreateAppointmentRequest() {
    }

    public CreateAppointmentRequest(UUID customerId, String serviceName, String staffName,
                                   Instant startTime, Instant endTime, String notes) {
        this.customerId = customerId;
        this.serviceName = serviceName;
        this.staffName = staffName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
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

    public String getBookingSource() {
        return bookingSource;
    }

    public void setBookingSource(String bookingSource) {
        this.bookingSource = bookingSource;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
