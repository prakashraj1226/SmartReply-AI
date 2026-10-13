package com.smartreplyai.auth;

import com.smartreplyai.auth.dto.AuthResponse;
import com.smartreplyai.auth.dto.LoginRequest;
import com.smartreplyai.auth.dto.RegisterRequest;
import com.smartreplyai.auth.dto.UserProfileResponse;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.smartreplyai.auth.dto.ForgotPasswordRequest;
import com.smartreplyai.auth.dto.ResetPasswordRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Map<String, Object> result = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password reset link dispatched", result));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        Map<String, Object> result = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully", result));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }
        UserProfileResponse profile = authService.getCurrentUser(principal);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }
}
