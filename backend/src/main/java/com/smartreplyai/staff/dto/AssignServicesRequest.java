package com.smartreplyai.staff.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class AssignServicesRequest {

    @NotNull(message = "Service IDs list is required")
    private List<UUID> serviceIds;

    public AssignServicesRequest() {
    }

    public AssignServicesRequest(List<UUID> serviceIds) {
        this.serviceIds = serviceIds;
    }

    public List<UUID> getServiceIds() {
        return serviceIds;
    }

    public void setServiceIds(List<UUID> serviceIds) {
        this.serviceIds = serviceIds;
    }
}
