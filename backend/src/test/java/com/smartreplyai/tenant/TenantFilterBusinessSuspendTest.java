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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantFilterBusinessSuspendTest {

    @Mock
    private BusinessMemberRepository businessMemberRepository;
    @Mock
    private BusinessRepository businessRepository;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;

    private TenantFilter tenantFilter;
    private UUID userId;
    private UUID businessId;

    @BeforeEach
    void setUp() {
        tenantFilter = new TenantFilter(businessMemberRepository, businessRepository, staffRepository);
        userId = UUID.randomUUID();
        businessId = UUID.randomUUID();
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void suspendedBusiness_Returns403AndDoesNotContinueChain() throws ServletException, IOException {
        com.smartreplyai.auth.User user = new com.smartreplyai.auth.User();
        user.setId(userId);
        user.setEmail("owner@shop.com");
        user.setPasswordHash("hash");
        user.setFullName("Owner");
        user.setRole("BUSINESS_OWNER");
        user.setActive(true);

        UserPrincipal principal = UserPrincipal.create(user, businessId);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        when(request.getHeader("X-Business-Id")).thenReturn(businessId.toString());

        BusinessMember member = mock(BusinessMember.class);
        when(member.getMembershipStatus()).thenReturn("ACTIVE");
        when(businessMemberRepository.findByBusinessIdAndUserId(businessId, userId))
                .thenReturn(Optional.of(member));

        Business business = new Business();
        business.setId(businessId);
        business.setActive(false);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));

        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        tenantFilter.doFilter(request, response, filterChain);

        verify(response).setStatus(403);
        assertTrue(body.toString().toLowerCase().contains("suspended"));
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void activeBusiness_ContinuesFilterChain() throws ServletException, IOException {
        com.smartreplyai.auth.User user = new com.smartreplyai.auth.User();
        user.setId(userId);
        user.setEmail("owner@shop.com");
        user.setPasswordHash("hash");
        user.setFullName("Owner");
        user.setRole("BUSINESS_OWNER");
        user.setActive(true);

        UserPrincipal principal = UserPrincipal.create(user, businessId);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        when(request.getHeader("X-Business-Id")).thenReturn(businessId.toString());

        BusinessMember member = mock(BusinessMember.class);
        when(member.getMembershipStatus()).thenReturn("ACTIVE");
        when(member.getRole()).thenReturn("OWNER");
        when(businessMemberRepository.findByBusinessIdAndUserId(businessId, userId))
                .thenReturn(Optional.of(member));

        Business business = new Business();
        business.setId(businessId);
        business.setActive(true);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(staffRepository.findByBusinessIdAndUserId(businessId, userId)).thenReturn(Optional.empty());

        tenantFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }
}
