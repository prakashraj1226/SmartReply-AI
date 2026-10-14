package com.smartreplyai.appointment.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TimeSlotDto {

    private Instant startTime;
    private Instant endTime;
    private String timeFormatted;
    private boolean available;
    private List<AvailableStaffSummary> availableStaff = new ArrayList<>();

    public static class AvailableStaffSummary {
        private UUID staffId;
        private String staffName;
        private String staffType;

        public AvailableStaffSummary() {
        }

        public AvailableStaffSummary(UUID staffId, String staffName, String staffType) {
            this.staffId = staffId;
            this.staffName = staffName;
            this.staffType = staffType;
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

        public String getStaffType() {
            return staffType;
        }

        public void setStaffType(String staffType) {
            this.staffType = staffType;
        }
    }

    public TimeSlotDto() {
    }

    public TimeSlotDto(Instant startTime, Instant endTime, String timeFormatted, boolean available) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.timeFormatted = timeFormatted;
        this.available = available;
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

    public String getTimeFormatted() {
        return timeFormatted;
    }

    public void setTimeFormatted(String timeFormatted) {
        this.timeFormatted = timeFormatted;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public List<AvailableStaffSummary> getAvailableStaff() {
        return availableStaff;
    }

    public void setAvailableStaff(List<AvailableStaffSummary> availableStaff) {
        this.availableStaff = availableStaff;
    }
}
