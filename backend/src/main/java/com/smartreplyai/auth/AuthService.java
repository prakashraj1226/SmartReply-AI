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

import java.text.Normalizer;
import java.util.Locale;
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

        // 5. Initialize Free Tier Subscription
        SubscriptionPlan freePlan = subscriptionPlanRepository.findByCode("FREE")
                .orElse(null);
        if (freePlan != null) {
            Subscription subscription = new Subscription(business, freePlan);
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
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID businessId = principal.getDefaultBusinessId();
        String businessName = "";
        boolean onboardingCompleted = false;

        if (businessId != null) {
            Business business = businessRepository.findById(businessId).orElse(null);
            if (business != null) {
                businessName = business.getName();
                onboardingCompleted = business.isOnboardingCompleted();
            }
        }

        String token = tokenProvider.generateToken(principal);

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                businessId,
                businessName,
                onboardingCompleted
        );
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID businessId = principal.getDefaultBusinessId();
        String businessName = "";
        boolean onboardingCompleted = false;

        if (businessId != null) {
            Business business = businessRepository.findById(businessId).orElse(null);
            if (business != null) {
                businessName = business.getName();
                onboardingCompleted = business.isOnboardingCompleted();
            }
        }

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                businessId,
                businessName,
                onboardingCompleted
        );
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
}
