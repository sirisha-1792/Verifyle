package com.verifyle.app.repository;

import com.verifyle.app.model.OtpToken;
import com.verifyle.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findTopByUserOrderByCreatedAtDesc(User user);

    Optional<OtpToken> findTopByUserEmailOrderByCreatedAtDesc(String email);
}
