package com.verifyle.app.model;

import com.verifyle.app.model.enums.Role;
import com.verifyle.app.model.enums.StepStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A concrete instance of a workflow step tied to a specific document request.
 * Created when a document is submitted, one per step in the workflow template.
 * Only the current step is active; reviewers can only act on their assigned step.
 */
@Entity
@Table(name = "workflow_step_instances")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WorkflowStepInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_request_id", nullable = false)
    private DocumentRequest documentRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_version_id")
    private DocumentVersion documentVersion;

    @Column(nullable = false)
    private Integer stepOrder;

    @Column(nullable = false)
    private String stepName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role reviewerRole;

    /** Specific reviewer assigned. If null, any user with the role can act. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_reviewer_id")
    private User assignedReviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = StepStatus.PENDING;
    }
}
