package com.smartreplyai.subscription;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import com.smartreplyai.subscription.dto.CheckoutOrderDto;
import com.smartreplyai.subscription.dto.SubscriptionDetailsDto;
import com.smartreplyai.subscription.dto.VerifyPaymentRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getPlans() {
        List<SubscriptionPlan> plans = subscriptionService.getPlans();
        return ResponseEntity.ok(ApiResponse.ok(plans));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<SubscriptionDetailsDto>> getCurrentSubscription() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        SubscriptionDetailsDto details = subscriptionService.getSubscriptionDetails(businessId);
        return ResponseEntity.ok(ApiResponse.ok(details));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<CheckoutOrderDto>> createCheckoutOrder(
            @RequestBody Map<String, String> body) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        String planCode = body.get("planCode");
        if (planCode == null || planCode.isBlank()) throw new BadRequestException("Plan code is required");

        CheckoutOrderDto order = subscriptionService.createCheckoutOrder(businessId, planCode);
        return ResponseEntity.ok(ApiResponse.ok("Checkout order created", order));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<SubscriptionDetailsDto>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        SubscriptionDetailsDto details = subscriptionService.verifyAndActivateSubscription(businessId, req);
        return ResponseEntity.ok(ApiResponse.ok("Subscription activated successfully", details));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelSubscription() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        subscriptionService.cancelSubscription(businessId);
        return ResponseEntity.ok(ApiResponse.ok("Subscription scheduled for cancellation at period end", null));
    }
}
