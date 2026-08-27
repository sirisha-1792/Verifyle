package com.verifyle.app.model.enums;

/**
 * Status of a document request through the workflow.
 */
public enum DocumentStatus {
    SUBMITTED,
    IN_REVIEW,
    CORRECTION_REQUESTED,
    REJECTED,
    APPROVED,
    VERIFIED
}
