package com.smartreplyai.settings.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateMemberStatusRequest {

    @NotBlank(message = "Status is required (ACTIVE or SUSPENDED)")
    private String status; // ACTIVE, SUSPENDED

    public UpdateMemberStatusRequest() {
    }

    public UpdateMemberStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
