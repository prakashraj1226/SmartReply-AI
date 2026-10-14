package com.smartreplyai.staff.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateStaffLeaveRequest {

    @NotNull(message = "Leave date is required")
    private LocalDate leaveDate;

    private String reason;

    public CreateStaffLeaveRequest() {
    }

    public CreateStaffLeaveRequest(LocalDate leaveDate, String reason) {
        this.leaveDate = leaveDate;
        this.reason = reason;
    }

    public LocalDate getLeaveDate() {
        return leaveDate;
    }

    public void setLeaveDate(LocalDate leaveDate) {
        this.leaveDate = leaveDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
