package com.verifyle.app.service;

import com.verifyle.app.dto.WorkflowTemplateRequest;
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
 * Manages workflow templates and runtime workflow execution.
 * Handles template creation, workflow instantiation, and step advancement.
 */
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowStepTemplateRepository stepTemplateRepository;
    private final WorkflowStepInstanceRepository stepInstanceRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final UserRepository userRepository;

    /**
     * Creates a workflow template with ordered steps. Admin only.
     */
    @Transactional
    public WorkflowTemplate createTemplate(WorkflowTemplateRequest request, User admin) {
        DocumentType docType = documentTypeRepository.findById(request.getDocumentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Document type not found"));

        WorkflowTemplate template = WorkflowTemplate.builder()
                .name(request.getName())
                .documentType(docType)
                .createdBy(admin)
                .build();

        // Add steps in order
        for (int i = 0; i < request.getSteps().size(); i++) {
            WorkflowTemplateRequest.StepRequest stepReq = request.getSteps().get(i);

            Role reviewerRole;
            try {
                reviewerRole = Role.valueOf(stepReq.getReviewerRole());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid reviewer role: " + stepReq.getReviewerRole());
            }

            WorkflowStepTemplate step = WorkflowStepTemplate.builder()
                    .workflowTemplate(template)
                    .stepOrder(i + 1)
                    .stepName(stepReq.getStepName())
                    .reviewerRole(reviewerRole)
                    .build();

            if (stepReq.getAssignedUserId() != null) {
                User assignedUser = userRepository.findById(stepReq.getAssignedUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
                step.setAssignedUser(assignedUser);
            }

            template.getSteps().add(step);
        }

        return templateRepository.save(template);
    }

    /**
     * Creates workflow step instances for a document request based on its workflow template.
     */
    @Transactional
    public void instantiateWorkflow(DocumentRequest docRequest, DocumentVersion version) {
        WorkflowTemplate template = docRequest.getWorkflowTemplate();
        List<WorkflowStepTemplate> stepTemplates = stepTemplateRepository
                .findByWorkflowTemplateOrderByStepOrderAsc(template);

        for (WorkflowStepTemplate stepTemplate : stepTemplates) {
            WorkflowStepInstance instance = WorkflowStepInstance.builder()
                    .documentRequest(docRequest)
                    .documentVersion(version)
                    .stepOrder(stepTemplate.getStepOrder())
                    .stepName(stepTemplate.getStepName())
                    .reviewerRole(stepTemplate.getReviewerRole())
                    .assignedReviewer(stepTemplate.getAssignedUser())
                    .status(stepTemplate.getStepOrder() == 1 ? StepStatus.IN_PROGRESS : StepStatus.PENDING)
                    .build();

            stepInstanceRepository.save(instance);
        }

        docRequest.setCurrentStepOrder(1);
        docRequest.setStatus(DocumentStatus.IN_REVIEW);
    }

    /**
     * Advances the workflow to the next step after approval, or marks the doc as APPROVED/VERIFIED if final.
     */
    @Transactional
    public void advanceWorkflow(DocumentRequest docRequest) {
        List<WorkflowStepInstance> allSteps = stepInstanceRepository
                .findByDocumentRequestOrderByStepOrderAsc(docRequest);

        int currentOrder = docRequest.getCurrentStepOrder();
        int totalSteps = allSteps.size();

        if (currentOrder >= totalSteps) {
            // Final step was approved — document is now APPROVED
            docRequest.setStatus(DocumentStatus.APPROVED);
        } else {
            // Move to next step
            int nextOrder = currentOrder + 1;
            docRequest.setCurrentStepOrder(nextOrder);

            WorkflowStepInstance nextStep = allSteps.stream()
                    .filter(s -> s.getStepOrder() == nextOrder)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Next workflow step not found"));

            nextStep.setStatus(StepStatus.IN_PROGRESS);
            stepInstanceRepository.save(nextStep);
        }
    }

    /**
     * Resets workflow to step 1 (used when submitter re-uploads after correction).
     */
    @Transactional
    public void resetWorkflow(DocumentRequest docRequest, DocumentVersion newVersion) {
        // Delete old step instances
        List<WorkflowStepInstance> oldSteps = stepInstanceRepository
                .findByDocumentRequestOrderByStepOrderAsc(docRequest);
        stepInstanceRepository.deleteAll(oldSteps);

        // Re-instantiate from template
        instantiateWorkflow(docRequest, newVersion);
    }

    /**
     * Gets the current active step for a document request.
     */
    public WorkflowStepInstance getCurrentStep(DocumentRequest docRequest) {
        return stepInstanceRepository
                .findByDocumentRequestAndStepOrder(docRequest, docRequest.getCurrentStepOrder())
                .orElse(null);
    }

    public List<WorkflowTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    public WorkflowTemplate getTemplateForDocType(DocumentType docType) {
        return templateRepository.findTopByDocumentTypeOrderByCreatedAtDesc(docType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No workflow template found for document type: " + docType.getName()));
    }
}
