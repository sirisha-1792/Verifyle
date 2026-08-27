package com.verifyle.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReviewActionRequest {

    @NotBlank(message = "Decision is required (APPROVED, REJECTED, CORRECTION_REQUESTED)")
    private String decision;

    /** Required for REJECTED and CORRECTION_REQUESTED decisions. */
    private String reason;
}
