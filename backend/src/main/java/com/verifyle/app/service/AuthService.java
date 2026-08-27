package com.verifyle.app.service;

import com.verifyle.app.dto.*;
import com.verifyle.app.exception.BadRequestException;
import com.verifyle.app.exception.UnauthorizedException;
import com.verifyle.app.model.User;
import com.verifyle.app.model.enums.Role;
import com.verifyle.app.repository.UserRepository;
import com.verifyle.app.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles user registration, email OTP verification, and JWT login.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;

    /**
     * Registers a new submitter user. Sends OTP for email verification.
     */
    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_SUBMITTER)
                .emailVerified(false)
                .enabled(true)
                .build();

        userRepository.save(user);
        return otpService.generateAndSendOtp(user);
    }

    /**
     * Verifies the email OTP. Marks user as email-verified.
     */
    @Transactional
    public void verifyOtp(OtpVerifyRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtpCode());
        if (!valid) {
            throw new BadRequestException("Invalid or expired OTP. Please try again or request a new OTP.");
        }

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    /**
     * Resends OTP with 60-second cooldown enforcement.
     */
    @Transactional
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        if (!otpService.canResendOtp(email)) {
            long remaining = otpService.getRemainingCooldown(email);
            throw new BadRequestException("Please wait " + remaining + " seconds before requesting a new OTP");
        }

        return otpService.generateAndSendOtp(user);
    }

    /**
     * Authenticates user and returns JWT token. Blocks unverified users.
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.getEmailVerified()) {
            throw new UnauthorizedException("Please verify your email before logging in");
        }

        if (!user.getEnabled()) {
            throw new UnauthorizedException("Your account has been disabled. Contact admin.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .userId(user.getId())
                .build();
    }
}
