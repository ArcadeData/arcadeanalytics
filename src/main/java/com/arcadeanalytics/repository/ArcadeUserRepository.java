package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.ArcadeUser;
import com.arcadeanalytics.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


/**
 * Spring Data JPA repository for the ArcadeUser entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ArcadeUserRepository extends JpaRepository<ArcadeUser, Long> {


    Optional<ArcadeUser> findByUser(User user);

    Optional<ArcadeUser> findByUserLogin(String login);
}
