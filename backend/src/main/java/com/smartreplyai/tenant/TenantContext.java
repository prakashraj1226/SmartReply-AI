package com.smartreplyai.tenant;

import java.util.UUID;

public final class TenantContext {
    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setBusinessId(UUID businessId) {
        CURRENT_TENANT.set(businessId);
    }

    public static UUID getBusinessId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
