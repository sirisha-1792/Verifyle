package com.verifyle.app.config;

import com.verifyle.app.model.*;
import com.verifyle.app.model.enums.Role;
import com.verifyle.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the database with demo users, document types, and workflow templates on first run.
 * Only runs if no users exist in the database (idempotent).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final WorkflowTemplateRepository workflowTemplateRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded, skipping...");
            return;
        }

        log.info("Seeding database with demo data...");

        // ===== Create Users =====
        User admin = createUser("Admin User", "admin@verifyle.com", "Admin@123", Role.ROLE_ADMIN);
        User hr = createUser("HR Manager", "hr@verifyle.com", "Verify@123", Role.ROLE_VERIFIER);
        User manager = createUser("Dept Manager", "manager@verifyle.com", "Verify@123", Role.ROLE_VERIFIER);
        User finance = createUser("Finance Officer", "finance@verifyle.com", "Verify@123", Role.ROLE_VERIFIER);
        User submitter = createUser("John Doe", "submitter@verifyle.com", "Submit@123", Role.ROLE_SUBMITTER);
        User submitter2 = createUser("Jane Smith", "jane@verifyle.com", "Submit@123", Role.ROLE_SUBMITTER);

        // ===== Create Document Types =====
        DocumentType internCert = createDocumentType("Intern Certificate", "Certificate issued upon internship completion", admin);
        DocumentType employmentDoc = createDocumentType("Employment Document", "Employment verification and related documents", admin);
        DocumentType idProof = createDocumentType("ID Proof", "Government-issued identity document", admin);

        // ===== Create Workflow Templates =====

        // Intern Certificate: HR → Manager → HR Final Approval
        WorkflowTemplate internWorkflow = WorkflowTemplate.builder()
                .name("Intern Certificate Workflow")
                .documentType(internCert)
                .createdBy(admin)
                .build();

        WorkflowStepTemplate step1 = WorkflowStepTemplate.builder()
                .workflowTemplate(internWorkflow)
                .stepOrder(1)
                .stepName("HR Review")
                .reviewerRole(Role.ROLE_VERIFIER)
                .assignedUser(hr)
                .build();

        WorkflowStepTemplate step2 = WorkflowStepTemplate.builder()
                .workflowTemplate(internWorkflow)
                .stepOrder(2)
                .stepName("Department Manager Review")
                .reviewerRole(Role.ROLE_VERIFIER)
                .assignedUser(manager)
                .build();

        WorkflowStepTemplate step3 = WorkflowStepTemplate.builder()
                .workflowTemplate(internWorkflow)
                .stepOrder(3)
                .stepName("HR Final Approval")
                .reviewerRole(Role.ROLE_VERIFIER)
                .assignedUser(hr)
                .build();

        internWorkflow.setSteps(List.of(step1, step2, step3));
        workflowTemplateRepository.save(internWorkflow);

        // Employment Document: Manager → Finance → HR
        WorkflowTemplate empWorkflow = WorkflowTemplate.builder()
                .name("Employment Document Workflow")
                .documentType(employmentDoc)
                .createdBy(admin)
                .build();

        WorkflowStepTemplate empStep1 = WorkflowStepTemplate.builder()
                .workflowTemplate(empWorkflow)
                .stepOrder(1)
                .stepName("Manager Verification")
                .reviewerRole(Role.ROLE_VERIFIER)
                .assignedUser(manager)
                .build();

        WorkflowStepTemplate empStep2 = WorkflowStepTemplate.builder()
                .workflowTemplate(empWorkflow)
                .stepOrder(2)
                .stepName("Finance Verification")
                .reviewerRole(Role.ROLE_VERIFIER)
                .assignedUser(finance)
                .build();

        WorkflowStepTemplate empStep3 = WorkflowStepTemplate.builder()
                .workflowTemplate(empWorkflow)
                .stepOrder(3)
                .stepName("HR Final Approval")
                .reviewerRole(Role.ROLE_VERIFIER)
                .assignedUser(hr)
                .build();

        empWorkflow.setSteps(List.of(empStep1, empStep2, empStep3));
        workflowTemplateRepository.save(empWorkflow);

        // ID Proof: HR Review (single step)
        WorkflowTemplate idWorkflow = WorkflowTemplate.builder()
                .name("ID Proof Workflow")
                .documentType(idProof)
                .createdBy(admin)
                .build();

        WorkflowStepTemplate idStep1 = WorkflowStepTemplate.builder()
                .workflowTemplate(idWorkflow)
                .stepOrder(1)
                .stepName("HR Verification")
                .reviewerRole(Role.ROLE_VERIFIER)
                .assignedUser(hr)
                .build();

        idWorkflow.setSteps(List.of(idStep1));
        workflowTemplateRepository.save(idWorkflow);

        log.info("========================================");
        log.info("Database seeded successfully!");
        log.info("Demo Credentials:");
        log.info("  Admin:     admin@verifyle.com / Admin@123");
        log.info("  HR:        hr@verifyle.com / Verify@123");
        log.info("  Manager:   manager@verifyle.com / Verify@123");
        log.info("  Finance:   finance@verifyle.com / Verify@123");
        log.info("  Submitter: submitter@verifyle.com / Submit@123");
        log.info("  Submitter: jane@verifyle.com / Submit@123");
        log.info("========================================");
    }

    private User createUser(String fullName, String email, String password, Role role) {
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .emailVerified(true)
                .enabled(true)
                .build();
        return userRepository.save(user);
    }

    private DocumentType createDocumentType(String name, String description, User admin) {
        DocumentType dt = DocumentType.builder()
                .name(name)
                .description(description)
                .createdBy(admin)
                .build();
        return documentTypeRepository.save(dt);
    }
}
