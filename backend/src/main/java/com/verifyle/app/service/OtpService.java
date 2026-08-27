package com.verifyle.app.service;

import com.verifyle.app.model.OtpToken;
import com.verifyle.app.model.User;
import com.verifyle.app.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * OTP generation, validation, and lifecycle management.
 * Enforces 5-minute expiry, max 5 attempts, and 60-second resend cooldown.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a new 6-digit OTP, saves it, and sends it via email.
     */
    public void generateAndSendOtp(User user) {
        String otpCode = String.format("%06d", secureRandom.nextInt(1000000));

        OtpToken otpToken = OtpToken.builder()
                .user(user)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .verified(false)
                .attempts(0)
                .build();

        otpTokenRepository.save(otpToken);
        emailService.sendOtpEmail(user.getEmail(), otpCode);
    }

    /**
     * Validates the provided OTP code against the latest OTP for the user.
     * @return true if OTP is valid, false otherwise
     */
    public boolean verifyOtp(String email, String otpCode) {
        Optional<OtpToken> optionalOtp = otpTokenRepository.findTopByUserEmailOrderByCreatedAtDesc(email);

        if (optionalOtp.isEmpty()) {
            return false;
        }

        OtpToken otpToken = optionalOtp.get();

        // Check if already verified
        if (otpToken.getVerified()) {
            return false;
        }

        // Check if expired
        if (otpToken.isExpired()) {
            return false;
        }

        // Check max attempts
        if (otpToken.getAttempts() >= maxAttempts) {
            return false;
        }

        // Increment attempts
        otpToken.setAttempts(otpToken.getAttempts() + 1);

        // Check OTP code
        if (!otpToken.getOtpCode().equals(otpCode)) {
            otpTokenRepository.save(otpToken);
            return false;
        }

        // OTP is valid — mark as verified
        otpToken.setVerified(true);
        otpTokenRepository.save(otpToken);
        return true;
    }

    /**
     * Checks if a resend is allowed (60-second cooldown between resends).
     */
    public boolean canResendOtp(String email) {
        Optional<OtpToken> optionalOtp = otpTokenRepository.findTopByUserEmailOrderByCreatedAtDesc(email);
        if (optionalOtp.isEmpty()) {
            return true;
        }
        OtpToken lastOtp = optionalOtp.get();
        return lastOtp.getCreatedAt().plusSeconds(resendCooldownSeconds).isBefore(LocalDateTime.now());
    }

    /**
     * Gets remaining cooldown seconds before a resend is allowed.
     */
    public long getRemainingCooldown(String email) {
        Optional<OtpToken> optionalOtp = otpTokenRepository.findTopByUserEmailOrderByCreatedAtDesc(email);
        if (optionalOtp.isEmpty()) {
            return 0;
        }
        OtpToken lastOtp = optionalOtp.get();
        LocalDateTime nextAllowed = lastOtp.getCreatedAt().plusSeconds(resendCooldownSeconds);
        if (LocalDateTime.now().isAfter(nextAllowed)) {
            return 0;
        }
        return java.time.Duration.between(LocalDateTime.now(), nextAllowed).getSeconds();
    }
}
