package com.smartreplyai.subscription;

import java.util.Map;

public class PlanLimits {

    public record LimitConfig(
            String code,
            String name,
            int maxStaff,
            int maxCustomers,
            int maxKnowledgeEntries,
            int maxFaqEntries,
            int maxAiAssistantDailyChats,
            int maxAppointmentsDaily,
            int maxAppointmentsTotal,
            int maxConversationsMonthly,
            int maxGeminiRepliesDaily,
            int maxGeminiRepliesMonthly,
            boolean aiAssistantEnabled
    ) {}

    public static final LimitConfig TRIAL = new LimitConfig(
            "TRIAL",
            "Free Trial",
            2,
            5,
            2,
            2,
            10,
            2,
            15,
            Integer.MAX_VALUE, // No monthly customer conversation cap during trial
            50,                // Soft daily Gemini customer-reply cap
            Integer.MAX_VALUE,
            true
    );

    public static final LimitConfig STARTER = new LimitConfig(
            "STARTER",
            "Starter Plan",
            1,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            0,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            500,
            Integer.MAX_VALUE,
            1000,
            false // AI Assistant side chat off; WhatsApp/Telegram Gemini still allowed within monthly cap
    );

    public static final LimitConfig GROWTH = new LimitConfig(
            "GROWTH",
            "Growth Plan",
            3,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            2000,
            Integer.MAX_VALUE,
            5000,
            true
    );

    public static final LimitConfig PRO = new LimitConfig(
            "PRO",
            "Pro Business",
            10,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            10000,
            Integer.MAX_VALUE,
            20000,
            true
    );

    private static final Map<String, LimitConfig> CONFIGS = Map.of(
            "TRIAL", TRIAL,
            "FREE", TRIAL,
            "STARTER", STARTER,
            "GROWTH", GROWTH,
            "PRO", PRO
    );

    public static LimitConfig forPlan(String planCode) {
        if (planCode == null) {
            return null;
        }
        return CONFIGS.get(planCode.toUpperCase());
    }
}
