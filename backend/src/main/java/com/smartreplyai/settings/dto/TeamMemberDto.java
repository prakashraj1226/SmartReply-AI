package com.smartreplyai.settings.dto;

import java.time.Instant;
import java.util.UUID;

public class TeamMemberDto {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private String role;
    private String membershipStatus = "ACTIVE";
    private Instant joinedAt;

    public TeamMemberDto() {
    }

    public TeamMemberDto(UUID id, UUID userId, String fullName, String email, String role, String membershipStatus, Instant joinedAt) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.membershipStatus = membershipStatus != null ? membershipStatus : "ACTIVE";
        this.joinedAt = joinedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMembershipStatus() {
        return membershipStatus;
    }

    public void setMembershipStatus(String membershipStatus) {
        this.membershipStatus = membershipStatus;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}
