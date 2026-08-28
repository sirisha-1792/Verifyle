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
            log.info("DEV MODE - Registration OTP for {}: {}", toEmail, otpCode);
            log.info("========================================");
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
            log.info("OTP verification email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not deliver OTP email directly via SMTP to {}: {}", toEmail, e.getMessage());
            log.info("OTP code for {}: {}", toEmail, otpCode);
        }
    }

    public void sendPasswordResetOtp(String toEmail, String otpCode) {
        if (devMode) {
            log.info("========================================");
            log.info("DEV MODE - Password Reset OTP for {}: {}", toEmail, otpCode);
            log.info("========================================");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verifyle - Password Reset Verification Code");
            message.setText(
                    "Hello,\n\n" +
                    "A password reset request was received for your Verifyle account.\n\n" +
                    "Your 6-digit Password Reset OTP is: " + otpCode + "\n\n" +
                    "This code expires in 5 minutes. Do not share this code with anyone.\n\n" +
                    "If you did not request a password reset, please ignore this email or check your account security.\n\n" +
                    "Regards,\n" +
                    "Verifyle Security Team"
            );
            mailSender.send(message);
            log.info("Password reset OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not deliver Password Reset email directly via SMTP to {}: {}", toEmail, e.getMessage());
            log.info("Password Reset OTP for {}: {}", toEmail, otpCode);
        }
    }

    public void sendStatusUpdateEmail(String toEmail, String docTitle, String decision, String reason, String reviewerName) {
        if (devMode) {
            log.info("========================================");
            log.info("DEV MODE - Status update for document '{}': {} by {}", docTitle, decision, reviewerName);
            if (reason != null && !reason.isBlank()) {
                log.info("Reason / Notes: {}", reason);
            }
            log.info("Notification sent to submitter: {}", toEmail);
            log.info("========================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verifyle - Update on your document: " + docTitle);
            String body = "Hello,\n\n" +
                    "Your submitted document \"" + docTitle + "\" has received a status update.\n\n" +
                    "Decision: " + decision + "\n" +
                    "Reviewed by: " + reviewerName + "\n";
            if (reason != null && !reason.isBlank()) {
                body += "Notes/Reason: " + reason + "\n";
            }
            body += "\nPlease log in to your Verifyle portal to view the details or track your workflow.\n\n" +
                    "Regards,\nVerifyle Verification Team";
            message.setText(body);
            mailSender.send(message);
            log.info("Status update email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send status update email to {}: {}", toEmail, e.getMessage());
        }
    }
}
