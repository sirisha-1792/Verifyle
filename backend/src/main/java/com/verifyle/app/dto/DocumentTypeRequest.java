package com.verifyle.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class DocumentTypeRequest {

    @NotBlank(message = "Document type name is required")
    private String name;

    private String description;
}
