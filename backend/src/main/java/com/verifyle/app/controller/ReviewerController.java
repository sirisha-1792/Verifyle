package com.verifyle.app.controller;

import com.verifyle.app.dto.ApiResponse;
import com.verifyle.app.dto.ReviewActionRequest;
import com.verifyle.app.model.*;
import com.verifyle.app.service.DocumentService;
import com.verifyle.app.service.ReviewService;
import com.verifyle.app.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Reviewer endpoints: view queue, review documents, approve/reject/request correction.
 */
@RestController
@RequestMapping("/api/reviewer")
@RequiredArgsConstructor
public class ReviewerController {

    private final ReviewService reviewService;
    private final DocumentService documentService;
    private final WorkflowService workflowService;

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getReviewQueue(Authentication authentication) {
        List<DocumentRequest> docs = reviewService.getReviewerQueue(authentication.getName());
        List<Map<String, Object>> result = docs.stream().map(this::mapQueueItem).toList();
        return ResponseEntity.ok(ApiResponse.success("Review queue retrieved", result));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getReviewHistory(Authentication authentication) {
        List<ReviewDecision> history = reviewService.getReviewerHistory(authentication.getName());
        List<Map<String, Object>> result = history.stream().map(d -> {
            Map<String, Object> dm = new LinkedHashMap<>();
            dm.put("id", d.getId());
            dm.put("documentId", d.getDocumentRequest().getId());
            dm.put("documentTitle", d.getDocumentRequest().getTitle());
            dm.put("documentType", d.getDocumentRequest().getDocumentType().getName());
            dm.put("submitterName", d.getDocumentRequest().getSubmitter().getFullName());
            dm.put("decision", d.getDecision().name());
            dm.put("reason", d.getReason());
            dm.put("stepName", d.getWorkflowStepInstance().getStepName());
            dm.put("versionNumber", d.getDocumentVersion().getVersionNumber());
            dm.put("createdAt", d.getCreatedAt().toString());
            return dm;
        }).toList();
        return ResponseEntity.ok(ApiResponse.success("Review history retrieved", result));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDocumentForReview(
            @PathVariable Long id, Authentication authentication) {
        DocumentRequest doc = documentService.getDocumentById(id);
        Map<String, Object> result = mapDocumentForReview(doc);
        return ResponseEntity.ok(ApiResponse.success("Document retrieved", result));
    }

    @PostMapping("/documents/{id}/review")
    public ResponseEntity<ApiResponse<Void>> submitReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewActionRequest request,
            Authentication authentication) {
        reviewService.submitReview(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Review decision submitted successfully"));
    }

    private Map<String, Object> mapQueueItem(DocumentRequest doc) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", doc.getId());
        map.put("title", doc.getTitle());
        map.put("description", doc.getDescription());
        map.put("documentType", doc.getDocumentType().getName());
        map.put("submitterName", doc.getSubmitter().getFullName());
        map.put("submitterEmail", doc.getSubmitter().getEmail());
        map.put("status", doc.getStatus().name());
        map.put("currentStep", doc.getCurrentStepOrder());
        map.put("createdAt", doc.getCreatedAt().toString());

        WorkflowStepInstance currentStep = workflowService.getCurrentStep(doc);
        if (currentStep != null) {
            map.put("currentStepName", currentStep.getStepName());
        }

        return map;
    }

    private Map<String, Object> mapDocumentForReview(DocumentRequest doc) {
        Map<String, Object> map = mapQueueItem(doc);

        // Add versions
        List<DocumentVersion> versions = documentService.getDocumentVersions(doc.getId());
        List<Map<String, Object>> versionList = versions.stream().map(v -> {
            Map<String, Object> vm = new LinkedHashMap<>();
            vm.put("id", v.getId());
            vm.put("versionNumber", v.getVersionNumber());
            vm.put("originalFileName", v.getOriginalFileName());
            vm.put("fileSize", v.getFileSize());
            vm.put("contentType", v.getContentType());
            vm.put("uploadedAt", v.getUploadedAt().toString());
            return vm;
        }).toList();
        map.put("versions", versionList);

        // Add audit trail
        List<ReviewDecision> decisions = reviewService.getDocumentAuditTrail(doc.getId());
        List<Map<String, Object>> auditList = decisions.stream().map(d -> {
            Map<String, Object> dm = new LinkedHashMap<>();
            dm.put("id", d.getId());
            dm.put("reviewer", d.getReviewer().getFullName());
            dm.put("decision", d.getDecision().name());
            dm.put("reason", d.getReason());
            dm.put("stepName", d.getWorkflowStepInstance().getStepName());
            dm.put("versionNumber", d.getDocumentVersion().getVersionNumber());
            dm.put("createdAt", d.getCreatedAt().toString());
            return dm;
        }).toList();
        map.put("auditTrail", auditList);

        // Workflow step info
        List<WorkflowStepInstance> allSteps = doc.getStepInstances();
        List<Map<String, Object>> stepList = allSteps.stream().map(s -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("stepOrder", s.getStepOrder());
            sm.put("stepName", s.getStepName());
            sm.put("status", s.getStatus().name());
            sm.put("reviewerRole", s.getReviewerRole().name());
            return sm;
        }).toList();
        map.put("workflowSteps", stepList);

        return map;
    }
}
