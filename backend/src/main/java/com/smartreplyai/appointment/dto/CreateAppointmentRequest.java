package com.smartreplyai.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public class CreateAppointmentRequest {

    @NotNull(message = "Customer ID is required")
    private UUID customerId;

    @NotBlank(message = "Service name is required")
    private String serviceName;

    private String staffName;

    @NotNull(message = "Start time is required")
    private Instant startTime;

    @NotNull(message = "End time is required")
    private Instant endTime;

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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
