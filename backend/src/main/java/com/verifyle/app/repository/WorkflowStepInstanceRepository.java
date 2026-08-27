package com.verifyle.app.repository;

import com.verifyle.app.model.DocumentRequest;
import com.verifyle.app.model.WorkflowStepInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStepInstanceRepository extends JpaRepository<WorkflowStepInstance, Long> {

    List<WorkflowStepInstance> findByDocumentRequestOrderByStepOrderAsc(DocumentRequest documentRequest);

    Optional<WorkflowStepInstance> findByDocumentRequestAndStepOrder(DocumentRequest documentRequest, Integer stepOrder);
}
