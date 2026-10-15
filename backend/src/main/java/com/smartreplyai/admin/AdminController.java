package com.smartreplyai.admin;

import com.smartreplyai.admin.dto.AdminBusinessDto;
import com.smartreplyai.admin.dto.AdminOverviewDto;
import com.smartreplyai.admin.dto.AdminUserDto;
import com.smartreplyai.admin.dto.AuditLogDto;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.security.UserPrincipal;
import com.smartreplyai.subscription.SubscriptionService;
import com.smartreplyai.subscription.dto.PendingPaymentDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    public AdminController(AdminService adminService, UserRepository userRepository, SubscriptionService subscriptionService) {
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewDto>> getPlatformOverview() {
        AdminOverviewDto overview = adminService.getPlatformOverview();
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }

    @GetMapping("/businesses")
    public ResponseEntity<ApiResponse<List<AdminBusinessDto>>> getAllBusinesses() {
        List<AdminBusinessDto> businesses = adminService.getAllBusinesses();
        return ResponseEntity.ok(ApiResponse.ok(businesses));
    }

    @PatchMapping("/businesses/{id}/status")
    public ResponseEntity<ApiResponse<AdminBusinessDto>> updateBusinessStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        if (!body.containsKey("active")) {
            throw new BadRequestException("Field 'active' is required");
        }
        boolean active = body.get("active");

        User adminUser = null;
        if (principal != null) {
            adminUser = userRepository.findById(principal.getId()).orElse(null);
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }

        AdminBusinessDto updated = adminService.updateBusinessStatus(id, active, adminUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Business status updated successfully", updated));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getAllUsers() {
        List<AdminUserDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/payments/pending")
    public ResponseEntity<ApiResponse<List<PendingPaymentDto>>> getPaymentsAwaitingConfirmation() {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.listPaymentsAwaitingConfirmation()));
    }

    @PostMapping("/payments/{id}/confirm")
    public ResponseEntity<ApiResponse<PendingPaymentDto>> confirmPayment(@PathVariable UUID id) {
        PendingPaymentDto payment = subscriptionService.confirmReceivedPayment(id);
        return ResponseEntity.ok(ApiResponse.ok("Payment received. Plan is now active.", payment));
    }

    @PostMapping("/payments/{id}/reject")
    public ResponseEntity<ApiResponse<PendingPaymentDto>> rejectPayment(@PathVariable UUID id) {
        PendingPaymentDto payment = subscriptionService.rejectPayment(id);
        return ResponseEntity.ok(ApiResponse.ok("Payment marked as not received. Plan was not changed.", payment));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getAuditLogs() {
        List<AuditLogDto> logs = adminService.getAuditLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
