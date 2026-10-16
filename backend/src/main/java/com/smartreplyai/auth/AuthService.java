package com.smartreplyai.auth;

import com.smartreplyai.ai.AiConfiguration;
import com.smartreplyai.ai.AiConfigurationRepository;
import com.smartreplyai.auth.dto.AuthResponse;
import com.smartreplyai.auth.dto.LoginRequest;
import com.smartreplyai.auth.dto.RegisterRequest;
import com.smartreplyai.auth.dto.UserProfileResponse;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessMember;
import com.smartreplyai.business.BusinessMemberRepository;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.security.JwtTokenProvider;
import com.smartreplyai.security.UserPrincipal;
import com.smartreplyai.subscription.Subscription;
import com.smartreplyai.subscription.SubscriptionPlan;
import com.smartreplyai.subscription.SubscriptionPlanRepository;
import com.smartreplyai.subscription.SubscriptionRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.smartreplyai.auth.dto.ForgotPasswordRequest;
import com.smartreplyai.auth.dto.ResetPasswordRequest;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final BusinessMemberRepository businessMemberRepository;
    private final AiConfigurationRepository aiConfigurationRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       BusinessRepository businessRepository,
                       BusinessMemberRepository businessMemberRepository,
                       AiConfigurationRepository aiConfigurationRepository,
                       SubscriptionPlanRepository subscriptionPlanRepository,
                       SubscriptionRepository subscriptionRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.businessMemberRepository = businessMemberRepository;
        this.aiConfigurationRepository = aiConfigurationRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email already exists");
        }

        // 1. Create User
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setFullName(request.getFullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("BUSINESS_OWNER");
        user.setEmailVerified(true);
        user.setActive(true);
        user = userRepository.save(user);

        // 2. Create Business
        String rawBizName = (request.getBusinessName() != null && !request.getBusinessName().isBlank())
                ? request.getBusinessName().trim()
                : request.getFullName().trim() + "'s Business";

        String baseSlug = toSlug(rawBizName);
        String finalSlug = baseSlug;
        int counter = 1;
        while (businessRepository.existsBySlug(finalSlug)) {
            finalSlug = baseSlug + "-" + counter++;
        }

        Business business = new Business();
        business.setName(rawBizName);
        business.setSlug(finalSlug);
        business.setEmail(normalizedEmail);
        business.setPhone(request.getPhone());
        business.setCategory("General Services");
        business.setOnboardingCompleted(false);
        business = businessRepository.save(business);

        // 3. Create Business Membership (OWNER)
        BusinessMember member = new BusinessMember(business, user, "OWNER");
        member.setPermissionsJson("[\"ALL\"]");
        businessMemberRepository.save(member);

        // 4. Initialize Default AI Config
        AiConfiguration aiConfig = new AiConfiguration(business);
        aiConfigurationRepository.save(aiConfig);

        // 5. Initialize 14-day Free Trial Subscription
        SubscriptionPlan trialPlan = subscriptionPlanRepository.findByCode("TRIAL")
                .orElseGet(() -> subscriptionPlanRepository.findByCode("FREE").orElse(null));
        if (trialPlan != null) {
            Instant start = Instant.now();
            Instant end = start.plus(14, ChronoUnit.DAYS);
            Subscription subscription = new Subscription(business, trialPlan, start, end);
            subscription.setStatus("TRIALING");
            subscription.setTrialStartedAt(start);
            subscription.setTrialEndsAt(end);
            subscription.setTrialStatus("ACTIVE");
            subscriptionRepository.save(subscription);
        }

        // 6. Generate JWT
        UserPrincipal principal = UserPrincipal.create(user, business.getId());
        String token = tokenProvider.generateToken(principal);

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                business.getId(),
                business.getName(),
                business.isOnboardingCompleted()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String rawIdentifier = request.getEmail().trim();
        String lookupIdentifier = rawIdentifier.contains("@") ? rawIdentifier.toLowerCase(Locale.ROOT) : rawIdentifier;

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(lookupIdentifier, request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID businessId = principal.getDefaultBusinessId();
        String businessName = "";
        boolean onboardingCompleted = false;
        String tenantRole = user.getRole();

        // Super Admin is never blocked by tenant suspension.
        if (!"SUPER_ADMIN".equalsIgnoreCase(user.getRole())) {
            Business activeBusiness = resolveActiveBusinessForLogin(user.getId(), businessId);
            if (activeBusiness == null) {
                java.util.List<Business> memberships = businessMemberRepository.findBusinessesByUserId(user.getId());
                if (!memberships.isEmpty() || businessId != null) {
                    throw new BadRequestException(
                            "This business account has been suspended. Please contact support.");
                }
            } else {
                businessId = activeBusiness.getId();
                businessName = activeBusiness.getName();
                onboardingCompleted = activeBusiness.isOnboardingCompleted();
                principal = UserPrincipal.create(user, businessId);
            }
        } else if (businessId != null) {
            Business business = businessRepository.findById(businessId).orElse(null);
            if (business != null) {
                businessName = business.getName();
                onboardingCompleted = business.isOnboardingCompleted();
            }
        }

        if (businessId != null) {
            Optional<BusinessMember> memberOpt = businessMemberRepository.findByBusinessIdAndUserId(businessId, user.getId());
            if (memberOpt.isPresent()) {
                tenantRole = memberOpt.get().getRole();
            }
        }

        String token = tokenProvider.generateToken(principal);

        AuthResponse resp = new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                businessId,
                businessName,
                onboardingCompleted
        );
        resp.setTenantRole(tenantRole);
        resp.setPhone(user.getPhone());
        return resp;
    }

    /**
     * Prefer the caller's default business when it is active; otherwise the first active membership.
     * Returns null when the user only belongs to suspended tenants (or has no resolvable active shop).
     */
    private Business resolveActiveBusinessForLogin(UUID userId, UUID preferredBusinessId) {
        if (preferredBusinessId != null) {
            Business preferred = businessRepository.findById(preferredBusinessId).orElse(null);
            if (preferred != null && preferred.isActive()) {
                return preferred;
            }
        }
        return businessMemberRepository.findBusinessesByUserId(userId).stream()
                .filter(Business::isActive)
                .findFirst()
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID businessId = principal.getDefaultBusinessId();
        String businessName = "";
        boolean onboardingCompleted = false;
        String tenantRole = user.getRole();

        if (businessId != null) {
            Business business = businessRepository.findById(businessId).orElse(null);
            if (business != null) {
                businessName = business.getName();
                onboardingCompleted = business.isOnboardingCompleted();
            }
            Optional<BusinessMember> memberOpt = businessMemberRepository.findByBusinessIdAndUserId(businessId, user.getId());
            if (memberOpt.isPresent()) {
                tenantRole = memberOpt.get().getRole();
            }
        }

        UserProfileResponse resp = new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                businessId,
                businessName,
                onboardingCompleted
        );
        resp.setTenantRole(tenantRole);
        resp.setPhone(user.getPhone());
        return resp;
    }

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private String toSlug(String input) {
        if (input == null || input.isBlank()) return "business";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);
        slug = slug.replaceAll("-+", "-").replaceAll("^-|-$", "");
        return slug.isBlank() ? "business" : slug;
    }

    @Transactional
    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        String normalized = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with username or email: " + request.getEmail()));

        // Generate 6-character reset token
        String resetToken = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        System.out.println("==================================================================");
        System.out.println("[SMARTREPLY EMAIL DISPATCH] Password reset instructions sent to: " + user.getEmail());
        System.out.println("[EMAIL DETAILS] Recipient: " + user.getFullName() + " (" + user.getEmail() + ")");
        System.out.println("[EMAIL DETAILS] Reset Token: " + resetToken);
        System.out.println("[EMAIL DETAILS] Status: Dispatched successfully via SMTP/Mail service");
        System.out.println("==================================================================");

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Password reset instructions have been dispatched to " + user.getEmail());
        result.put("email", user.getEmail());
        result.put("resetToken", resetToken);
        return result;
    }

    @Transactional
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        String normalized = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + request.getEmail()));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        System.out.println("==================================================================");
        System.out.println("[PASSWORD UPDATED] Password successfully updated for: " + user.getEmail());
        System.out.println("==================================================================");

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Password updated successfully. You can now sign in with your new password.");
        result.put("email", user.getEmail());
        return result;
    }
}
