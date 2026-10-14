package com.smartreplyai.staff.dto;

import com.smartreplyai.staff.StaffLeave;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class StaffLeaveDto {

    private UUID id;
    private UUID staffId;
    private LocalDate leaveDate;
    private String reason;
    private String status;
    private Instant createdAt;

    public StaffLeaveDto() {
    }

    public static StaffLeaveDto fromEntity(StaffLeave l) {
        StaffLeaveDto dto = new StaffLeaveDto();
        dto.setId(l.getId());
        dto.setStaffId(l.getStaff().getId());
        dto.setLeaveDate(l.getLeaveDate());
        dto.setReason(l.getReason());
        dto.setStatus(l.getStatus());
        dto.setCreatedAt(l.getCreatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getStaffId() {
        return staffId;
    }

    public void setStaffId(UUID staffId) {
        this.staffId = staffId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
