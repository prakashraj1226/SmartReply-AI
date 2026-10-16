package com.smartreplyai.tenant;

import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.security.UserPrincipal;
import com.smartreplyai.staff.StaffRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class TenantFilter extends OncePerRequestFilter {

    private final BusinessMemberRepository businessMemberRepository;
    private final BusinessRepository businessRepository;
    private final StaffRepository staffRepository;

    public TenantFilter(BusinessMemberRepository businessMemberRepository,
                        BusinessRepository businessRepository,
                        StaffRepository staffRepository) {
        this.businessMemberRepository = businessMemberRepository;
        this.businessRepository = businessRepository;
        this.staffRepository = staffRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                String headerBusinessId = request.getHeader("X-Business-Id");
                UUID targetBusinessId = null;

                if (StringUtils.hasText(headerBusinessId)) {
                    try {
                        targetBusinessId = UUID.fromString(headerBusinessId.trim());
                    } catch (IllegalArgumentException ignored) {
                        sendForbiddenResponse(response, "Invalid X-Business-Id header format");
                        return;
                    }
                } else {
                    targetBusinessId = principal.getDefaultBusinessId();
                }

                if (targetBusinessId != null) {
                    TenantContext.setUserId(principal.getId());
                    if ("SUPER_ADMIN".equalsIgnoreCase(principal.getRole())) {
                        TenantContext.setBusinessId(targetBusinessId);
                        TenantContext.setRole("SUPER_ADMIN");
                        TenantContext.setMembershipStatus("ACTIVE");
                    } else {
                        Optional<BusinessMember> memberOpt = businessMemberRepository.findByBusinessIdAndUserId(targetBusinessId, principal.getId());

                        if (memberOpt.isEmpty()) {
                            // User does not belong to this business!
                            sendForbiddenResponse(response, "Access Denied: You are not an authorized member of this business tenant");
                            return;
                        }

                        BusinessMember member = memberOpt.get();
                        String status = member.getMembershipStatus() != null ? member.getMembershipStatus() : "ACTIVE";

                        if ("SUSPENDED".equalsIgnoreCase(status)) {
                            sendForbiddenResponse(response, "Access Denied: Your membership in this business is currently suspended");
                            return;
                        }

                        // Whole-tenant suspend (Super Admin Suspend) — source of truth: businesses.is_active
                        Optional<Business> businessOpt = businessRepository.findById(targetBusinessId);
                        if (businessOpt.isEmpty() || !businessOpt.get().isActive()) {
                            sendForbiddenResponse(response, "Access Denied: This business is currently suspended.");
                            return;
                        }

                        TenantContext.setBusinessId(targetBusinessId);
                        TenantContext.setRole(member.getRole());
                        TenantContext.setMembershipStatus(status);

                        // If user is linked to a staff record in this business, bind staffId
                        staffRepository.findByBusinessIdAndUserId(targetBusinessId, principal.getId())
                                .ifPresent(staff -> TenantContext.setStaffId(staff.getId()));
                    }
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void sendForbiddenResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String body = String.format("{\"success\":false,\"message\":\"%s\",\"status\":403}", message);
        response.getWriter().write(body);
    }
}
