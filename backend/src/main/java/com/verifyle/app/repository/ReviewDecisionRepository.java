package com.verifyle.app.repository;

import com.verifyle.app.model.DocumentRequest;
import com.verifyle.app.model.ReviewDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewDecisionRepository extends JpaRepository<ReviewDecision, Long> {

    List<ReviewDecision> findByDocumentRequestOrderByCreatedAtAsc(DocumentRequest documentRequest);

    List<ReviewDecision> findAllByOrderByCreatedAtDesc();
}
