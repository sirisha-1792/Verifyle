package com.verifyle.app.repository;

import com.verifyle.app.model.DocumentRequest;
import com.verifyle.app.model.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {

    List<DocumentVersion> findByDocumentRequestOrderByVersionNumberDesc(DocumentRequest documentRequest);

    Optional<DocumentVersion> findTopByDocumentRequestOrderByVersionNumberDesc(DocumentRequest documentRequest);
}
