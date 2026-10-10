package com.smartreplyai.tenant;

import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class TenantFilter extends OncePerRequestFilter {

    private final BusinessMemberRepository businessMemberRepository;

    public TenantFilter(BusinessMemberRepository businessMemberRepository) {
        this.businessMemberRepository = businessMemberRepository;
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
                        UUID parsedId = UUID.fromString(headerBusinessId.trim());
                        // Verify user belongs to this business or is SUPER_ADMIN
                        if ("SUPER_ADMIN".equals(principal.getRole()) ||
                                businessMemberRepository.existsByBusinessIdAndUserId(parsedId, principal.getId())) {
                            targetBusinessId = parsedId;
                        }
                    } catch (IllegalArgumentException ignored) {
                        // Invalid UUID format
                    }
                }

                if (targetBusinessId == null) {
                    targetBusinessId = principal.getDefaultBusinessId();
                }

                if (targetBusinessId != null) {
                    TenantContext.setBusinessId(targetBusinessId);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
