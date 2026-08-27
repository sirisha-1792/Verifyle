package com.verifyle.app.repository;

import com.verifyle.app.model.DocumentType;
import com.verifyle.app.model.WorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, Long> {

    List<WorkflowTemplate> findByDocumentType(DocumentType documentType);

    Optional<WorkflowTemplate> findTopByDocumentTypeOrderByCreatedAtDesc(DocumentType documentType);
}
