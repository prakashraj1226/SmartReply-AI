package com.smartreplyai.staff.dto;

import com.smartreplyai.staff.StaffAvailability;
import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.UUID;

public class StaffAvailabilityDto {

    private UUID id;
    private UUID staffId;
    private int dayOfWeek;
    private String dayName;
    private String startTime;
    private String endTime;
    private String breakStartTime;
    private String breakEndTime;
    private boolean isActive;

    public StaffAvailabilityDto() {
    }

    public static StaffAvailabilityDto fromEntity(StaffAvailability a) {
        StaffAvailabilityDto dto = new StaffAvailabilityDto();
        dto.setId(a.getId());
        dto.setStaffId(a.getStaff().getId());
        dto.setDayOfWeek(a.getDayOfWeek());
        try {
            dto.setDayName(DayOfWeek.of(a.getDayOfWeek()).getDisplayName(TextStyle.FULL, Locale.ENGLISH));
        } catch (Exception e) {
            dto.setDayName("Day " + a.getDayOfWeek());
        }
        dto.setStartTime(a.getStartTime() != null ? a.getStartTime().toString() : null);
        dto.setEndTime(a.getEndTime() != null ? a.getEndTime().toString() : null);
        dto.setBreakStartTime(a.getBreakStartTime() != null ? a.getBreakStartTime().toString() : null);
        dto.setBreakEndTime(a.getBreakEndTime() != null ? a.getBreakEndTime().toString() : null);
        dto.setActive(a.isActive());
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

    public int getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(int dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getDayName() {
        return dayName;
    }

    public void setDayName(String dayName) {
        this.dayName = dayName;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getBreakStartTime() {
        return breakStartTime;
    }

    public void setBreakStartTime(String breakStartTime) {
        this.breakStartTime = breakStartTime;
    }

    public String getBreakEndTime() {
        return breakEndTime;
    }

    public void setBreakEndTime(String breakEndTime) {
        this.breakEndTime = breakEndTime;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
