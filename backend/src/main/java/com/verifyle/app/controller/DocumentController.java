package com.verifyle.app.controller;

import com.verifyle.app.dto.ApiResponse;
import com.verifyle.app.model.DocumentVersion;
import com.verifyle.app.service.DocumentService;
import com.verifyle.app.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Shared document endpoints accessible by any authenticated user.
 * Handles file downloads.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final FileStorageService fileStorageService;

    @GetMapping("/download/{versionId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long versionId) {
        DocumentVersion version = documentService.getVersionById(versionId);
        Resource resource = fileStorageService.loadFileAsResource(version.getStoredFileName());

        String contentType = version.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + version.getOriginalFileName() + "\"")
                .body(resource);
    }
}
