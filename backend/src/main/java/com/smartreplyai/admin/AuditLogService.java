package com.smartreplyai.admin;

import com.smartreplyai.auth.User;
import com.smartreplyai.business.Business;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog logAction(Business business, User user, String action, String entityType, String entityId, String detailsJson, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog(business, user, action, entityType, entityId, detailsJson, ipAddress);
            AuditLog saved = auditLogRepository.save(auditLog);
            log.info("Audit log recorded: action={} entityType={} entityId={} user={}",
                    action, entityType, entityId, user != null ? user.getEmail() : "system");
            return saved;
        } catch (Exception e) {
            log.error("Failed to record audit log action={}", action, e);
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getBusinessLogs(UUID businessId) {
        return auditLogRepository.findTop50ByBusinessIdOrderByCreatedAtDesc(businessId);
    }
}
