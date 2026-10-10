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

    public AdminController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
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

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getAuditLogs() {
        List<AuditLogDto> logs = adminService.getAuditLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
