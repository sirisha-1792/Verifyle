package com.verifyle.app.model;

import com.verifyle.app.model.enums.Decision;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Immutable audit log entry recording every review decision.
 * Captures who reviewed, what decision was made, and why.
 * This table is append-only — no updates or deletes allowed.
 */
@Entity
@Table(name = "review_decisions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ReviewDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_request_id", nullable = false)
    private DocumentRequest documentRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_version_id", nullable = false)
    private DocumentVersion documentVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_step_instance_id", nullable = false)
    private WorkflowStepInstance workflowStepInstance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Decision decision;

    @Column(length = 2000)
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
