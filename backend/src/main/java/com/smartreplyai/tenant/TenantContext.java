package com.smartreplyai.tenant;

import com.smartreplyai.security.TenantRole;

import java.util.Arrays;
import java.util.UUID;

public final class TenantContext {
    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<UUID> CURRENT_USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_ROLE = new ThreadLocal<>();
    private static final ThreadLocal<String> MEMBERSHIP_STATUS = new ThreadLocal<>();
    private static final ThreadLocal<UUID> CURRENT_STAFF_ID = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setBusinessId(UUID businessId) {
        CURRENT_TENANT.set(businessId);
    }

    public static void setCurrentTenant(UUID businessId) {
        setBusinessId(businessId);
    }

    public static UUID getBusinessId() {
        return CURRENT_TENANT.get();
    }

    public static void setUserId(UUID userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static UUID getUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void setRole(String role) {
        CURRENT_ROLE.set(role);
    }

    public static String getRole() {
        return CURRENT_ROLE.get();
    }

    public static void setMembershipStatus(String status) {
        MEMBERSHIP_STATUS.set(status);
    }

    public static String getMembershipStatus() {
        return MEMBERSHIP_STATUS.get();
    }

    public static void setStaffId(UUID staffId) {
        CURRENT_STAFF_ID.set(staffId);
    }

    public static UUID getStaffId() {
        return CURRENT_STAFF_ID.get();
    }

    public static boolean hasRole(String... roles) {
        String current = CURRENT_ROLE.get();
        if (current == null) return false;
        return Arrays.stream(roles).anyMatch(r -> r.equalsIgnoreCase(current));
    }

    public static boolean isOwnerOrAdmin() {
        return hasRole("OWNER", "BUSINESS_OWNER", "BUSINESS_ADMIN", "ADMIN", "SUPER_ADMIN");
    }

    public static boolean hasPermission(String permission) {
        String role = CURRENT_ROLE.get();
        if (role == null) return false;
        if ("SUPER_ADMIN".equalsIgnoreCase(role)) return true;
        return TenantRole.hasPermission(role, permission);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        CURRENT_USER_ID.remove();
        CURRENT_ROLE.remove();
        MEMBERSHIP_STATUS.remove();
        CURRENT_STAFF_ID.remove();
    }
}
