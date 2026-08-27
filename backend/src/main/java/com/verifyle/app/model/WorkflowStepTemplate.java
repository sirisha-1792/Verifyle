package com.verifyle.app.model;

import com.verifyle.app.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;

/**
 * A single step in a workflow template.
 * Defines which role (and optionally which specific user) reviews at this step.
 */
@Entity
@Table(name = "workflow_step_templates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WorkflowStepTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_template_id", nullable = false)
    private WorkflowTemplate workflowTemplate;

    @Column(nullable = false)
    private Integer stepOrder;

    @Column(nullable = false)
    private String stepName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role reviewerRole;

    /** Optional: specific user assigned to this step. If null, any user with the role can review. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;
}
