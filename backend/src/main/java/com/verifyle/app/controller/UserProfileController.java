package com.verifyle.app.controller;

import com.verifyle.app.dto.ApiResponse;
import com.verifyle.app.exception.BadRequestException;
import com.verifyle.app.exception.ResourceNotFoundException;
import com.verifyle.app.model.User;
import com.verifyle.app.repository.DocumentRequestRepository;
import com.verifyle.app.repository.ReviewDecisionRepository;
import com.verifyle.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * User profile & account management endpoints: view profile, update details, change password.
 * Accessible by all authenticated users (Admin, Reviewer, Submitter).
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DocumentRequestRepository documentRequestRepository;
    private final ReviewDecisionRepository reviewDecisionRepository;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("emailVerified", user.getEmailVerified());
        map.put("enabled", user.getEnabled());
        map.put("createdAt", user.getCreatedAt().toString());

        // Quick user statistics
        if (user.getRole().name().equals("ROLE_SUBMITTER")) {
            map.put("totalSubmissions", documentRequestRepository.findBySubmitterOrderByCreatedAtDesc(user).size());
        } else if (user.getRole().name().equals("ROLE_VERIFIER")) {
            map.put("totalReviews", reviewDecisionRepository.findByReviewerOrderByCreatedAtDesc(user).size());
        }

        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", map));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestBody Map<String, String> request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String fullName = request.get("fullName");
        if (fullName == null || fullName.trim().isEmpty()) {
            throw new BadRequestException("Full name cannot be empty");
        }

        user.setFullName(fullName.trim());
        userRepository.save(user);

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", map));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody Map<String, String> request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || currentPassword.isEmpty()) {
            throw new BadRequestException("Current password is required");
        }

        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
