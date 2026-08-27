package com.verifyle.app.service;

import com.verifyle.app.dto.ReviewActionRequest;
import com.verifyle.app.exception.BadRequestException;
import com.verifyle.app.exception.ResourceNotFoundException;
import com.verifyle.app.model.*;
import com.verifyle.app.model.enums.*;
import com.verifyle.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Handles reviewer actions: queue retrieval and review decision submission.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final DocumentRequestRepository documentRequestRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final WorkflowStepInstanceRepository stepInstanceRepository;
    private final ReviewDecisionRepository reviewDecisionRepository;
    private final UserRepository userRepository;
    private final WorkflowService workflowService;

    /**
     * Gets the queue of documents pending review for the given reviewer.
     * Returns documents where the current step matches the reviewer's role or specific assignment.
     */
    public List<DocumentRequest> getReviewerQueue(String reviewerEmail) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // First check for specifically assigned documents
        List<DocumentRequest> assigned = documentRequestRepository.findPendingForAssignedReviewer(reviewer);
        if (!assigned.isEmpty()) {
            return assigned;
        }

        // Fall back to role-based queue
        return documentRequestRepository.findPendingForReviewerRole(reviewer.getRole());
    }

    /**
     * Submits a review decision (APPROVE, REJECT, or REQUEST_CORRECTION) on a document.
     */
    @Transactional
    public void submitReview(Long documentId, ReviewActionRequest request, String reviewerEmail) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        DocumentRequest docRequest = documentRequestRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // Get current workflow step
        WorkflowStepInstance currentStep = workflowService.getCurrentStep(docRequest);
        if (currentStep == null) {
            throw new BadRequestException("No active workflow step found for this document");
        }

        // Verify the reviewer is authorized for this step
        validateReviewerAuthorization(reviewer, currentStep);

        // Parse decision
        Decision decision;
        try {
            decision = Decision.valueOf(request.getDecision().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid decision. Must be APPROVED, REJECTED, or CORRECTION_REQUESTED");
        }

        // Require reason for rejection and correction
        if ((decision == Decision.REJECTED || decision == Decision.CORRECTION_REQUESTED)
                && (request.getReason() == null || request.getReason().isBlank())) {
            throw new BadRequestException("Reason is required for rejection or correction request");
        }

        // Get current document version
        DocumentVersion currentVersion = documentVersionRepository
                .findTopByDocumentRequestOrderByVersionNumberDesc(docRequest)
                .orElseThrow(() -> new RuntimeException("No document version found"));

        // Create immutable audit log entry
        ReviewDecision reviewDecision = ReviewDecision.builder()
                .documentRequest(docRequest)
                .documentVersion(currentVersion)
                .workflowStepInstance(currentStep)
                .reviewer(reviewer)
                .decision(decision)
                .reason(request.getReason())
                .build();
        reviewDecisionRepository.save(reviewDecision);

        // Update step status
        currentStep.setCompletedAt(LocalDateTime.now());

        switch (decision) {
            case APPROVED:
                currentStep.setStatus(StepStatus.APPROVED);
                stepInstanceRepository.save(currentStep);
                workflowService.advanceWorkflow(docRequest);
                break;

            case REJECTED:
                currentStep.setStatus(StepStatus.REJECTED);
                stepInstanceRepository.save(currentStep);
                docRequest.setStatus(DocumentStatus.REJECTED);
                break;

            case CORRECTION_REQUESTED:
                currentStep.setStatus(StepStatus.CORRECTION_REQUESTED);
                stepInstanceRepository.save(currentStep);
                docRequest.setStatus(DocumentStatus.CORRECTION_REQUESTED);
                break;
        }

        documentRequestRepository.save(docRequest);
    }

    /**
     * Validates that the reviewer is authorized to act on the current step.
     */
    private void validateReviewerAuthorization(User reviewer, WorkflowStepInstance step) {
        // Check if a specific reviewer is assigned
        if (step.getAssignedReviewer() != null) {
            if (!step.getAssignedReviewer().getId().equals(reviewer.getId())) {
                throw new BadRequestException("You are not assigned to review this document at this step");
            }
            return;
        }

        // Check role-based authorization
        if (step.getReviewerRole() != reviewer.getRole()) {
            throw new BadRequestException("You are not authorized to review this document at this step");
        }
    }

    /**
     * Gets the full audit trail (all review decisions) for a document.
     */
    public List<ReviewDecision> getDocumentAuditTrail(Long documentId) {
        DocumentRequest docRequest = documentRequestRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return reviewDecisionRepository.findByDocumentRequestOrderByCreatedAtAsc(docRequest);
    }

    /**
     * Gets all review decisions (full audit log) — Admin only.
     */
    public List<ReviewDecision> getAllAuditLog() {
        return reviewDecisionRepository.findAllByOrderByCreatedAtDesc();
    }
}
