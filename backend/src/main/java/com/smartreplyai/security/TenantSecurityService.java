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
        if (TenantContext.isOwnerOrAdmin()) {
            return true;
        }
        return checkPrincipalRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN");
    }

    public boolean canManageTeam() {
        if (TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN")) {
            return true;
        }
        return checkPrincipalRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN");
    }

    public boolean canManageBilling() {
        if (TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "SUPER_ADMIN")) {
            return true;
        }
        return checkPrincipalRole("OWNER", "BUSINESS_OWNER", "SUPER_ADMIN");
    }

    public boolean canManageIntegrations() {
        if (TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN")) {
            return true;
        }
        return checkPrincipalRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN");
    }

    public boolean canManageCatalog() {
        if (TenantContext.hasRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "MANAGER", "SUPER_ADMIN")) {
            return true;
        }
        return checkPrincipalRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "MANAGER", "SUPER_ADMIN");
    }

    private boolean checkPrincipalRole(String... allowedRoles) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            String role = principal.getRole();
            if (role != null) {
                return java.util.Arrays.stream(allowedRoles).anyMatch(r -> r.equalsIgnoreCase(role));
            }
        }
        return false;
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
