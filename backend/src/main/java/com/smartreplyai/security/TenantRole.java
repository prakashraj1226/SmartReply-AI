package com.smartreplyai.security;

import java.util.Collections;
import java.util.Set;

public enum TenantRole {
    OWNER(Set.of("ALL")),
    BUSINESS_OWNER(Set.of("ALL")),
    BUSINESS_ADMIN(Set.of(
            "MANAGE_TEAM", "MANAGE_BRANCHES", "MANAGE_SERVICES", "MANAGE_STAFF",
            "MANAGE_APPOINTMENTS", "VIEW_APPOINTMENTS", "MANAGE_CUSTOMERS", "VIEW_CUSTOMERS",
            "MANAGE_INBOX", "MANAGE_AI", "VIEW_REPORTS"
    )),
    MANAGER(Set.of(
            "MANAGE_BRANCHES", "MANAGE_SERVICES", "MANAGE_STAFF", "MANAGE_APPOINTMENTS",
            "VIEW_APPOINTMENTS", "MANAGE_CUSTOMERS", "VIEW_CUSTOMERS", "MANAGE_INBOX",
            "VIEW_REPORTS"
    )),
    RECEPTIONIST(Set.of(
            "MANAGE_APPOINTMENTS", "VIEW_APPOINTMENTS", "MANAGE_CUSTOMERS", "VIEW_CUSTOMERS",
            "MANAGE_INBOX"
    )),
    DOCTOR(Set.of(
            "VIEW_APPOINTMENTS", "MANAGE_OWN_APPOINTMENTS", "VIEW_CUSTOMERS"
    )),
    DENTIST(Set.of(
            "VIEW_APPOINTMENTS", "MANAGE_OWN_APPOINTMENTS", "VIEW_CUSTOMERS"
    )),
    SALON_STAFF(Set.of(
            "VIEW_APPOINTMENTS", "MANAGE_OWN_APPOINTMENTS"
    )),
    AGENT(Set.of(
            "MANAGE_APPOINTMENTS", "VIEW_APPOINTMENTS", "MANAGE_CUSTOMERS", "VIEW_CUSTOMERS",
            "MANAGE_INBOX"
    ));

    private final Set<String> permissions;

    TenantRole(Set<String> permissions) {
        this.permissions = permissions;
    }

    public Set<String> getPermissions() {
        return Collections.unmodifiableSet(permissions);
    }

    public boolean allows(String permission) {
        if (permissions.contains("ALL")) return true;
        return permissions.contains(permission);
    }

    public static boolean hasPermission(String roleName, String permission) {
        if (roleName == null || permission == null) return false;
        try {
            TenantRole role = TenantRole.valueOf(roleName.toUpperCase().trim());
            return role.allows(permission.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
