package com.verifyle.app.controller;

import com.verifyle.app.dto.*;
import com.verifyle.app.model.*;
import com.verifyle.app.model.enums.DocumentStatus;
import com.verifyle.app.repository.DocumentRequestRepository;
import com.verifyle.app.repository.DocumentTypeRepository;
import com.verifyle.app.service.AdminService;
import com.verifyle.app.service.ReviewService;
import com.verifyle.app.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Admin endpoints: user management, workflow templates, submissions monitor, audit log.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final WorkflowService workflowService;
    private final ReviewService reviewService;
    private final DocumentRequestRepository documentRequestRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final com.verifyle.app.repository.UserRepository userRepository;

    // ===== User Management =====

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createUser(
            @Valid @RequestBody UserCreateRequest request) {
        User user = adminService.createUser(request);
        Map<String, Object> result = mapUser(user);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", result));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<User> users = adminService.getAllUsers();
        List<Map<String, Object>> result = users.stream().map(this::mapUser).toList();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", result));
    }

    // ===== Document Types =====

    @GetMapping("/document-types")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDocumentTypes() {
        List<DocumentType> types = documentTypeRepository.findAll();
        List<Map<String, Object>> result = types.stream().map(dt -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", dt.getId());
            map.put("name", dt.getName());
            map.put("description", dt.getDescription());
            map.put("createdAt", dt.getCreatedAt().toString());
            return map;
        }).toList();
        return ResponseEntity.ok(ApiResponse.success("Document types retrieved", result));
    }

    @PostMapping("/document-types")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createDocumentType(
            @Valid @RequestBody DocumentTypeRequest request, Authentication authentication) {
        User admin = userRepository.findByEmail(authentication.getName()).orElseThrow();

        DocumentType dt = DocumentType.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(admin)
                .build();
        dt = documentTypeRepository.save(dt);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", dt.getId());
        result.put("name", dt.getName());
        result.put("description", dt.getDescription());

        return ResponseEntity.ok(ApiResponse.success("Document type created", result));
    }

    // ===== Workflow Templates =====

    @PostMapping("/workflow-templates")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createWorkflowTemplate(
            @Valid @RequestBody WorkflowTemplateRequest request, Authentication authentication) {
        User admin = userRepository.findByEmail(authentication.getName()).orElseThrow();
        WorkflowTemplate template = workflowService.createTemplate(request, admin);

        Map<String, Object> result = mapWorkflowTemplate(template);
        return ResponseEntity.ok(ApiResponse.success("Workflow template created", result));
    }

    @GetMapping("/workflow-templates")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWorkflowTemplates() {
        List<WorkflowTemplate> templates = workflowService.getAllTemplates();
        List<Map<String, Object>> result = templates.stream()
                .map(this::mapWorkflowTemplate).toList();
        return ResponseEntity.ok(ApiResponse.success("Workflow templates retrieved", result));
    }

    // ===== Submissions Monitor =====

    @GetMapping("/submissions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllSubmissions(
            @RequestParam(required = false) String status) {
        List<DocumentRequest> docs;
        if (status != null && !status.isEmpty()) {
            try {
                DocumentStatus docStatus = DocumentStatus.valueOf(status.toUpperCase());
                docs = documentRequestRepository.findByStatus(docStatus);
            } catch (IllegalArgumentException e) {
                docs = documentRequestRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            docs = documentRequestRepository.findAllByOrderByCreatedAtDesc();
        }

        List<Map<String, Object>> result = docs.stream().map(doc -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", doc.getId());
            map.put("title", doc.getTitle());
            map.put("documentType", doc.getDocumentType().getName());
            map.put("submitterName", doc.getSubmitter().getFullName());
            map.put("submitterEmail", doc.getSubmitter().getEmail());
            map.put("status", doc.getStatus().name());
            map.put("currentStep", doc.getCurrentStepOrder());
            map.put("createdAt", doc.getCreatedAt().toString());
            map.put("updatedAt", doc.getUpdatedAt() != null ? doc.getUpdatedAt().toString() : null);
            return map;
        }).toList();

        return ResponseEntity.ok(ApiResponse.success("Submissions retrieved", result));
    }

    // ===== Dashboard Stats =====

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getDashboardStats() {
        Map<String, Long> stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved", stats));
    }

    // ===== Audit Log =====

    @GetMapping("/audit-log")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAuditLog() {
        List<ReviewDecision> decisions = reviewService.getAllAuditLog();
        List<Map<String, Object>> result = decisions.stream().map(this::mapAuditEntry).toList();
        return ResponseEntity.ok(ApiResponse.success("Audit log retrieved", result));
    }

    @GetMapping("/audit-log/{documentId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDocumentAuditTrail(
            @PathVariable Long documentId) {
        List<ReviewDecision> decisions = reviewService.getDocumentAuditTrail(documentId);
        List<Map<String, Object>> result = decisions.stream().map(this::mapAuditEntry).toList();
        return ResponseEntity.ok(ApiResponse.success("Document audit trail retrieved", result));
    }

    // ===== Helpers =====

    private Map<String, Object> mapUser(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("emailVerified", user.getEmailVerified());
        map.put("enabled", user.getEnabled());
        map.put("createdAt", user.getCreatedAt().toString());
        return map;
    }

    private Map<String, Object> mapWorkflowTemplate(WorkflowTemplate template) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", template.getId());
        map.put("name", template.getName());
        map.put("documentType", template.getDocumentType().getName());
        map.put("documentTypeId", template.getDocumentType().getId());
        map.put("createdAt", template.getCreatedAt().toString());

        List<Map<String, Object>> steps = template.getSteps().stream().map(s -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("stepOrder", s.getStepOrder());
            sm.put("stepName", s.getStepName());
            sm.put("reviewerRole", s.getReviewerRole().name());
            if (s.getAssignedUser() != null) {
                sm.put("assignedUser", s.getAssignedUser().getFullName());
                sm.put("assignedUserId", s.getAssignedUser().getId());
            }
            return sm;
        }).toList();
        map.put("steps", steps);

        return map;
    }

    private Map<String, Object> mapAuditEntry(ReviewDecision d) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", d.getId());
        map.put("documentId", d.getDocumentRequest().getId());
        map.put("documentTitle", d.getDocumentRequest().getTitle());
        map.put("reviewer", d.getReviewer().getFullName());
        map.put("reviewerEmail", d.getReviewer().getEmail());
        map.put("decision", d.getDecision().name());
        map.put("reason", d.getReason());
        map.put("stepName", d.getWorkflowStepInstance().getStepName());
        map.put("versionNumber", d.getDocumentVersion().getVersionNumber());
        map.put("createdAt", d.getCreatedAt().toString());
        return map;
    }
}
