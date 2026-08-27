package com.verifyle.app.controller;

import com.verifyle.app.dto.ApiResponse;
import com.verifyle.app.dto.DocumentSubmitRequest;
import com.verifyle.app.model.DocumentRequest;
import com.verifyle.app.model.DocumentVersion;
import com.verifyle.app.model.ReviewDecision;
import com.verifyle.app.model.WorkflowStepInstance;
import com.verifyle.app.service.DocumentService;
import com.verifyle.app.service.ReviewService;
import com.verifyle.app.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * Submitter endpoints: upload documents, view status, re-submit after correction.
 */
@RestController
@RequestMapping("/api/submitter")
@RequiredArgsConstructor
public class SubmitterController {

    private final DocumentService documentService;
    private final ReviewService reviewService;
    private final WorkflowService workflowService;

    @PostMapping("/documents")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitDocument(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("documentTypeId") Long documentTypeId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        DocumentSubmitRequest request = new DocumentSubmitRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setDocumentTypeId(documentTypeId);

        DocumentRequest doc = documentService.submitDocument(request, file, authentication.getName());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", doc.getId());
        response.put("title", doc.getTitle());
        response.put("status", doc.getStatus().name());

        return ResponseEntity.ok(ApiResponse.success("Document submitted successfully", response));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyDocuments(Authentication authentication) {
        List<DocumentRequest> docs = documentService.getSubmitterDocuments(authentication.getName());
        List<Map<String, Object>> result = docs.stream().map(this::mapDocumentSummary).toList();
        return ResponseEntity.ok(ApiResponse.success("Documents retrieved", result));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDocument(
            @PathVariable Long id, Authentication authentication) {
        DocumentRequest doc = documentService.getDocumentById(id, authentication.getName());
        Map<String, Object> result = mapDocumentDetail(doc);
        return ResponseEntity.ok(ApiResponse.success("Document retrieved", result));
    }

    @PostMapping("/documents/{id}/resubmit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resubmitDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        DocumentRequest doc = documentService.resubmitDocument(id, file, authentication.getName());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", doc.getId());
        response.put("title", doc.getTitle());
        response.put("status", doc.getStatus().name());

        return ResponseEntity.ok(ApiResponse.success("Document re-submitted successfully", response));
    }

    private Map<String, Object> mapDocumentSummary(DocumentRequest doc) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", doc.getId());
        map.put("title", doc.getTitle());
        map.put("description", doc.getDescription());
        map.put("documentType", doc.getDocumentType().getName());
        map.put("status", doc.getStatus().name());
        map.put("currentStep", doc.getCurrentStepOrder());
        map.put("createdAt", doc.getCreatedAt().toString());
        map.put("updatedAt", doc.getUpdatedAt() != null ? doc.getUpdatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> mapDocumentDetail(DocumentRequest doc) {
        Map<String, Object> map = mapDocumentSummary(doc);

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

        // Add workflow steps
        WorkflowStepInstance currentStep = workflowService.getCurrentStep(doc);
        if (currentStep != null) {
            Map<String, Object> stepMap = new LinkedHashMap<>();
            stepMap.put("stepName", currentStep.getStepName());
            stepMap.put("stepOrder", currentStep.getStepOrder());
            stepMap.put("status", currentStep.getStatus().name());
            map.put("currentStepInfo", stepMap);
        }

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

        return map;
    }
}
