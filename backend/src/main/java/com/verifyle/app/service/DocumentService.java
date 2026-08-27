package com.verifyle.app.service;

import com.verifyle.app.dto.DocumentSubmitRequest;
import com.verifyle.app.exception.BadRequestException;
import com.verifyle.app.exception.ResourceNotFoundException;
import com.verifyle.app.model.*;
import com.verifyle.app.model.enums.DocumentStatus;
import com.verifyle.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Handles document submission, retrieval, and re-submission after corrections.
 */
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRequestRepository documentRequestRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final WorkflowService workflowService;

    /**
     * Submits a new document — stores file, creates DocumentRequest + first DocumentVersion,
     * then instantiates the workflow.
     */
    @Transactional
    public DocumentRequest submitDocument(DocumentSubmitRequest request, MultipartFile file, String submitterEmail) {
        User submitter = userRepository.findByEmail(submitterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        DocumentType docType = documentTypeRepository.findById(request.getDocumentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Document type not found"));

        // Get workflow template for this document type
        WorkflowTemplate template = workflowService.getTemplateForDocType(docType);

        // Store file
        String storedFileName = fileStorageService.storeFile(file);

        // Create document request
        DocumentRequest docRequest = DocumentRequest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .documentType(docType)
                .submitter(submitter)
                .workflowTemplate(template)
                .status(DocumentStatus.SUBMITTED)
                .currentStepOrder(1)
                .build();
        docRequest = documentRequestRepository.save(docRequest);

        // Create first document version
        DocumentVersion version = DocumentVersion.builder()
                .documentRequest(docRequest)
                .versionNumber(1)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(fileStorageService.getFilePath(storedFileName))
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(submitter)
                .build();
        documentVersionRepository.save(version);

        // Instantiate the workflow
        workflowService.instantiateWorkflow(docRequest, version);

        return docRequest;
    }

    /**
     * Gets all documents submitted by a specific user.
     */
    public List<DocumentRequest> getSubmitterDocuments(String email) {
        User submitter = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return documentRequestRepository.findBySubmitterOrderByCreatedAtDesc(submitter);
    }

    /**
     * Gets a single document request by ID, with ownership check for submitters.
     */
    public DocumentRequest getDocumentById(Long id, String email) {
        DocumentRequest doc = documentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // Check ownership for submitters
        if (!doc.getSubmitter().getEmail().equals(email)) {
            throw new BadRequestException("You don't have access to this document");
        }

        return doc;
    }

    /**
     * Gets a document by ID without ownership check (for reviewers/admin).
     */
    public DocumentRequest getDocumentById(Long id) {
        return documentRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
    }

    /**
     * Re-submits a document after a correction request.
     * Creates a new version and resets the workflow to step 1.
     */
    @Transactional
    public DocumentRequest resubmitDocument(Long documentId, MultipartFile file, String submitterEmail) {
        DocumentRequest docRequest = getDocumentById(documentId, submitterEmail);

        if (docRequest.getStatus() != DocumentStatus.CORRECTION_REQUESTED) {
            throw new BadRequestException("Document is not in CORRECTION_REQUESTED status");
        }

        // Store new file
        String storedFileName = fileStorageService.storeFile(file);

        // Determine new version number
        DocumentVersion latestVersion = documentVersionRepository
                .findTopByDocumentRequestOrderByVersionNumberDesc(docRequest)
                .orElseThrow(() -> new RuntimeException("No existing version found"));

        User submitter = userRepository.findByEmail(submitterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Create new version
        DocumentVersion newVersion = DocumentVersion.builder()
                .documentRequest(docRequest)
                .versionNumber(latestVersion.getVersionNumber() + 1)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(fileStorageService.getFilePath(storedFileName))
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(submitter)
                .build();
        documentVersionRepository.save(newVersion);

        // Reset workflow to step 1
        workflowService.resetWorkflow(docRequest, newVersion);

        return docRequest;
    }

    /**
     * Gets all versions of a document.
     */
    public List<DocumentVersion> getDocumentVersions(Long documentId) {
        DocumentRequest docRequest = documentRequestRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return documentVersionRepository.findByDocumentRequestOrderByVersionNumberDesc(docRequest);
    }

    /**
     * Gets a specific document version for download.
     */
    public DocumentVersion getVersionById(Long versionId) {
        return documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Document version not found"));
    }
}
