package com.verifyle.app.repository;

import com.verifyle.app.model.WorkflowStepTemplate;
import com.verifyle.app.model.WorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowStepTemplateRepository extends JpaRepository<WorkflowStepTemplate, Long> {

    List<WorkflowStepTemplate> findByWorkflowTemplateOrderByStepOrderAsc(WorkflowTemplate template);
}
