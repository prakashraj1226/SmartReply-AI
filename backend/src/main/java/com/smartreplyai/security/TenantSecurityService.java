package com.smartreplyai.security;

import com.smartreplyai.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service("tenantSecurity")
public class TenantSecurityService {

    public boolean hasPermission(String permission) {
        return TenantContext.hasPermission(permission);
    }

    public boolean isOwnerOrAdmin() {
        return TenantContext.isOwnerOrAdmin();
    }

    public boolean canManageTeam() {
        return TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN");
    }

    public boolean canManageBilling() {
        return TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "SUPER_ADMIN");
    }

    public boolean canManageIntegrations() {
        return TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN");
    }

    public boolean canManageCatalog() {
        return TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "MANAGER", "SUPER_ADMIN");
    }

    public boolean canManageAppointments() {
        return TenantContext.hasPermission("MANAGE_APPOINTMENTS") || isOwnerOrAdmin();
    }

    public boolean canViewAppointments() {
        return TenantContext.hasPermission("VIEW_APPOINTMENTS") || isOwnerOrAdmin();
    }

    public boolean canManageCustomers() {
        return TenantContext.hasPermission("MANAGE_CUSTOMERS") || isOwnerOrAdmin();
    }

    public boolean canManageAi() {
        return TenantContext.hasPermission("MANAGE_AI") || isOwnerOrAdmin();
    }

    /**
     * Doctors, Dentists, and Salon Stylists can view all appointments if they are receptionists/managers/owners,
     * or view appointments specifically assigned to their practitioner staff profile.
     */
    public boolean canAccessStaffAppointment(UUID appointmentStaffId) {
        if (isOwnerOrAdmin() || TenantContext.hasRole("MANAGER", "RECEPTIONIST", "AGENT")) {
            return true;
        }

        UUID userStaffId = TenantContext.getStaffId();
        if (userStaffId == null) {
            return false;
        }
        return appointmentStaffId != null && appointmentStaffId.equals(userStaffId);
    }
}
