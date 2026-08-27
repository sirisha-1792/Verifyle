package com.verifyle.app.controller;

import com.verifyle.app.dto.ApiResponse;
import com.verifyle.app.model.DocumentType;
import com.verifyle.app.repository.DocumentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Shared endpoints accessible by any authenticated user.
 * Document types are needed by submitters when uploading.
 */
@RestController
@RequestMapping("/api/shared")
@RequiredArgsConstructor
public class SharedController {

    private final DocumentTypeRepository documentTypeRepository;

    @GetMapping("/document-types")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDocumentTypes() {
        List<DocumentType> types = documentTypeRepository.findAll();
        List<Map<String, Object>> result = types.stream().map(dt -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", dt.getId());
            map.put("name", dt.getName());
            map.put("description", dt.getDescription());
            return map;
        }).toList();
        return ResponseEntity.ok(ApiResponse.success("Document types retrieved", result));
    }
}
