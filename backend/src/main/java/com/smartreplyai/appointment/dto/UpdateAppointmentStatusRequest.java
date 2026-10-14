package com.smartreplyai.appointment.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateAppointmentStatusRequest {

    @NotBlank(message = "Status is required (e.g. CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)")
    private String status;

    private String notes;

    public UpdateAppointmentStatusRequest() {
    }

    public UpdateAppointmentStatusRequest(String status) {
        this.status = status;
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
}
