package com.verifyle.app.repository;

import com.verifyle.app.model.DocumentRequest;
import com.verifyle.app.model.User;
import com.verifyle.app.model.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRequestRepository extends JpaRepository<DocumentRequest, Long> {

    List<DocumentRequest> findBySubmitterOrderByCreatedAtDesc(User submitter);

    List<DocumentRequest> findByStatus(DocumentStatus status);

    List<DocumentRequest> findAllByOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT dr FROM DocumentRequest dr " +
           "JOIN dr.stepInstances si " +
           "WHERE si.stepOrder = dr.currentStepOrder " +
           "AND si.assignedReviewer IS NULL " +
           "AND si.reviewerRole = :role " +
           "AND si.status IN ('PENDING', 'IN_PROGRESS') " +
           "AND dr.status IN ('SUBMITTED', 'IN_REVIEW') " +
           "ORDER BY dr.createdAt DESC")
    List<DocumentRequest> findPendingForReviewerRole(@Param("role") com.verifyle.app.model.enums.Role role);

    @Query("SELECT DISTINCT dr FROM DocumentRequest dr " +
           "JOIN dr.stepInstances si " +
           "WHERE si.stepOrder = dr.currentStepOrder " +
           "AND si.assignedReviewer = :reviewer " +
           "AND si.status IN ('PENDING', 'IN_PROGRESS') " +
           "AND dr.status IN ('SUBMITTED', 'IN_REVIEW') " +
           "ORDER BY dr.createdAt DESC")
    List<DocumentRequest> findPendingForAssignedReviewer(@Param("reviewer") User reviewer);

    long countByStatus(DocumentStatus status);
}
