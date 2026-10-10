package com.smartreplyai.auth;

import com.smartreplyai.ai.AiConfigurationRepository;
import com.smartreplyai.auth.dto.AuthResponse;
import com.smartreplyai.auth.dto.RegisterRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.security.JwtTokenProvider;
import com.smartreplyai.security.UserPrincipal;
import com.smartreplyai.subscription.SubscriptionPlan;
import com.smartreplyai.subscription.SubscriptionPlanRepository;
import com.smartreplyai.subscription.SubscriptionRepository;
import com.smartreplyai.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private BusinessRepository businessRepository;
    @Mock
    private BusinessMemberRepository businessMemberRepository;
    @Mock
    private AiConfigurationRepository aiConfigurationRepository;
    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
    }

    @Test
    void register_ShouldCreateUserAndBusinessAndReturnAuthResponse() {
        RegisterRequest req = new RegisterRequest("Dr. Priya Sharma", "priya@dentalcare.com", "password123", "Apex Dental Clinic", "+919876543210");

        when(userRepository.existsByEmail("priya@dentalcare.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");

        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setEmail("priya@dentalcare.com");
        savedUser.setFullName("Dr. Priya Sharma");
        savedUser.setRole("BUSINESS_OWNER");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(businessRepository.existsBySlug(anyString())).thenReturn(false);
        Business savedBiz = new Business();
        savedBiz.setId(UUID.randomUUID());
        savedBiz.setName("Apex Dental Clinic");
        savedBiz.setSlug("apex-dental-clinic");
        when(businessRepository.save(any(Business.class))).thenReturn(savedBiz);

        SubscriptionPlan freePlan = new SubscriptionPlan();
        freePlan.setCode("FREE");
        when(subscriptionPlanRepository.findByCode("FREE")).thenReturn(Optional.of(freePlan));

        when(tokenProvider.generateToken(any(UserPrincipal.class))).thenReturn("mock-jwt-token");

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("mock-jwt-token", resp.getToken());
        assertEquals("priya@dentalcare.com", resp.getEmail());
        assertEquals("BUSINESS_OWNER", resp.getRole());
        assertEquals("Apex Dental Clinic", resp.getBusinessName());
        verify(businessMemberRepository, times(1)).save(any());
        verify(aiConfigurationRepository, times(1)).save(any());
    }

    @Test
    void register_WhenEmailExists_ShouldThrowBadRequestException() {
        RegisterRequest req = new RegisterRequest("Test User", "existing@dentalcare.com", "password123", "Clinic", null);
        when(userRepository.existsByEmail("existing@dentalcare.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void tenantContext_ShouldIsolatePerThread() {
        UUID businessId = UUID.randomUUID();
        TenantContext.setBusinessId(businessId);
        assertEquals(businessId, TenantContext.getBusinessId());

        TenantContext.clear();
        assertNull(TenantContext.getBusinessId());
    }
}
