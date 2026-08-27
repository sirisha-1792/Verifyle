package com.verifyle.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email service for sending OTP verification emails.
 * In dev mode, logs OTP to console instead of sending real email.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.otp.dev-mode:true}")
    private boolean devMode;

    @Value("${spring.mail.username:noreply@verifyle.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode) {
        if (devMode) {
            log.info("========================================");
            log.info("DEV MODE - OTP for {}: {}", toEmail, otpCode);
            log.info("========================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verifyle - Email Verification OTP");
            message.setText(
                    "Hello,\n\n" +
                    "Your OTP for email verification is: " + otpCode + "\n\n" +
                    "This OTP is valid for 5 minutes.\n\n" +
                    "If you did not request this, please ignore this email.\n\n" +
                    "Regards,\nVerifyle Team"
            );
            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            // In production, you might want to throw an exception here
            // For now, log it and continue (OTP is still saved in DB)
            log.warn("OTP for {} is: {} (email send failed, logging as fallback)", toEmail, otpCode);
        }
    }
}
