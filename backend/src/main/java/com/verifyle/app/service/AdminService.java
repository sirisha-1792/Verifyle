package com.verifyle.app.service;

import com.verifyle.app.dto.UserCreateRequest;
import com.verifyle.app.exception.BadRequestException;
import com.verifyle.app.model.User;
import com.verifyle.app.model.enums.Role;
import com.verifyle.app.repository.DocumentRequestRepository;
import com.verifyle.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin service for user management and dashboard statistics.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DocumentRequestRepository documentRequestRepository;

    /**
     * Creates a new user with the specified role. Email is pre-verified for admin-created users.
     */
    @Transactional
    public User createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole()
                    + ". Must be ROLE_ADMIN, ROLE_VERIFIER, or ROLE_SUBMITTER");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .emailVerified(true) // Admin-created users skip OTP
                .enabled(true)
                .build();

        return userRepository.save(user);
    }

    private final com.verifyle.app.repository.OtpTokenRepository otpTokenRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Deletes a user. Prevents deleting self or the only admin.
     */
    @Transactional
    public void deleteUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.verifyle.app.exception.ResourceNotFoundException("User not found"));

        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new BadRequestException("You cannot delete your own account");
        }

        if (user.getRole() == Role.ROLE_ADMIN && userRepository.countByRole(Role.ROLE_ADMIN) <= 1) {
            throw new BadRequestException("Cannot delete the only admin user");
        }

        // Delete associated OTP tokens first
        otpTokenRepository.deleteByUser(user);

        // Delete user
        userRepository.delete(user);
    }

    /**
     * Gets dashboard statistics for the admin panel.
     */
    public Map<String, Long> getDashboardStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalSubmissions", documentRequestRepository.count());
        stats.put("pendingReviews", documentRequestRepository.countByStatus(
                com.verifyle.app.model.enums.DocumentStatus.IN_REVIEW));
        stats.put("approved", documentRequestRepository.countByStatus(
                com.verifyle.app.model.enums.DocumentStatus.APPROVED));
        stats.put("rejected", documentRequestRepository.countByStatus(
                com.verifyle.app.model.enums.DocumentStatus.REJECTED));
        stats.put("correctionRequested", documentRequestRepository.countByStatus(
                com.verifyle.app.model.enums.DocumentStatus.CORRECTION_REQUESTED));
        return stats;
    }
}
