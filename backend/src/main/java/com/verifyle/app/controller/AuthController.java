package com.verifyle.app.controller;

import com.verifyle.app.dto.*;
import com.verifyle.app.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication endpoints: register, OTP verify, resend OTP, and login.
 * All endpoints are publicly accessible.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private final com.verifyle.app.service.OtpService otpService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
        String otp = authService.register(request);
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("email", request.getEmail());
        if (otpService.isDevMode()) {
            data.put("devOtp", otp);
            data.put("devMode", true);
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Registration successful. Please check your email for the OTP verification code.", data));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. You can now login."));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> resendOtp(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        String otp = authService.resendOtp(email);
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("email", email);
        if (otpService.isDevMode()) {
            data.put("devOtp", otp);
            data.put("devMode", true);
        }
        return ResponseEntity.ok(ApiResponse.success("OTP resent successfully. Please check your email.", data));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String otp = authService.forgotPassword(request);
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("email", request.getEmail());
        if (otpService.isDevMode()) {
            data.put("devOtp", otp);
            data.put("devMode", true);
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Password reset verification OTP has been sent to your email.", data));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Your password has been changed successfully. You can now sign in."));
    }
}
