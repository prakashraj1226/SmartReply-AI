package com.smartreplyai.notification;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getNotifications(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Page<NotificationDto> notifications = notificationService.getNotifications(businessId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        long count = notificationService.getUnreadCount(businessId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        notificationService.markAsRead(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        notificationService.markAllAsRead(businessId);
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }
}
