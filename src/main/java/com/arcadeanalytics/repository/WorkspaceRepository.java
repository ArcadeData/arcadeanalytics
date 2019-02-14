package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.ArcadeUser;
import com.arcadeanalytics.domain.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


/**
 * Spring Data JPA repository for the Workspace entity.
 */
@SuppressWarnings("unused")
@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    @Query("select workspace from Workspace workspace where workspace.user.user.login = ?#{principal.username}")
    Page<Workspace> findByUserIsCurrentUser(Pageable pageable);

    @Query("select workspace from Workspace workspace where workspace.user.user.login = ?#{principal.username}")
    List<Workspace> findByUserIsCurrentUser();

    List<Workspace> findByUser(ArcadeUser arcadeUser);

}
