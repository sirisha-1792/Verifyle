package com.verifyle.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WorkflowTemplateRequest {

    @NotBlank(message = "Workflow name is required")
    private String name;

    @NotNull(message = "Document type ID is required")
    private Long documentTypeId;

    @NotNull(message = "Steps are required")
    private List<StepRequest> steps;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class StepRequest {
        @NotBlank(message = "Step name is required")
        private String stepName;

        @NotBlank(message = "Reviewer role is required")
        private String reviewerRole;

        /** Optional: specific user ID to assign to this step. */
        private Long assignedUserId;
    }
}
