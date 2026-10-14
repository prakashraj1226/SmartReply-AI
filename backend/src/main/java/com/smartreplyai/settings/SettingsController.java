package com.smartreplyai.settings;

import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.security.UserPrincipal;
import com.smartreplyai.settings.dto.*;
import com.smartreplyai.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;
    private final UserRepository userRepository;

    public SettingsController(SettingsService settingsService, UserRepository userRepository) {
        this.settingsService = settingsService;
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<BusinessProfileDto>> getProfile() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        BusinessProfileDto profile = settingsService.getBusinessProfile(businessId);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("@tenantSecurity.isOwnerOrAdmin()")
    public ResponseEntity<ApiResponse<BusinessProfileDto>> updateProfile(
            @Valid @RequestBody BusinessProfileDto dto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        String ip = extractIp(request);

        BusinessProfileDto updated = settingsService.updateBusinessProfile(businessId, dto, user, ip);
        return ResponseEntity.ok(ApiResponse.ok("Business profile updated successfully", updated));
    }

    @GetMapping("/ai")
    public ResponseEntity<ApiResponse<AiConfigDto>> getAiConfig() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AiConfigDto config = settingsService.getAiConfiguration(businessId);
        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @PutMapping("/ai")
    @PreAuthorize("@tenantSecurity.canManageAi()")
    public ResponseEntity<ApiResponse<AiConfigDto>> updateAiConfig(
            @Valid @RequestBody AiConfigDto dto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        String ip = extractIp(request);

        AiConfigDto updated = settingsService.updateAiConfiguration(businessId, dto, user, ip);
        return ResponseEntity.ok(ApiResponse.ok("AI Assistant configuration updated successfully", updated));
    }

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<List<TeamMemberDto>>> getTeamMembers() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        List<TeamMemberDto> members = settingsService.getTeamMembers(businessId);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @PostMapping("/team")
    @PreAuthorize("@tenantSecurity.canManageTeam()")
    public ResponseEntity<ApiResponse<TeamMemberDto>> inviteTeamMember(
            @Valid @RequestBody InviteMemberRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        String ip = extractIp(request);

        TeamMemberDto member = settingsService.inviteTeamMember(businessId, req, user, ip);
        return ResponseEntity.ok(ApiResponse.ok("Team member added successfully", member));
    }

    @PatchMapping("/team/{memberId}/role")
    @PreAuthorize("@tenantSecurity.canManageTeam()")
    public ResponseEntity<ApiResponse<TeamMemberDto>> updateMemberRole(
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        String ip = extractIp(request);

        TeamMemberDto member = settingsService.updateTeamMemberRole(businessId, memberId, req, user, ip);
        return ResponseEntity.ok(ApiResponse.ok("Team member role updated successfully", member));
    }

    @PatchMapping("/team/{memberId}/status")
    @PreAuthorize("@tenantSecurity.canManageTeam()")
    public ResponseEntity<ApiResponse<TeamMemberDto>> updateMemberStatus(
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberStatusRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        String ip = extractIp(request);

        TeamMemberDto member = settingsService.updateTeamMemberStatus(businessId, memberId, req, user, ip);
        return ResponseEntity.ok(ApiResponse.ok("Team member membership status updated successfully", member));
    }

    @DeleteMapping("/team/{memberId}")
    @PreAuthorize("@tenantSecurity.canManageTeam()")
    public ResponseEntity<ApiResponse<Void>> removeTeamMember(
            @PathVariable UUID memberId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        String ip = extractIp(request);

        settingsService.removeTeamMember(businessId, memberId, user, ip);
        return ResponseEntity.ok(ApiResponse.ok("Team member removed successfully", null));
    }

    private String extractIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
