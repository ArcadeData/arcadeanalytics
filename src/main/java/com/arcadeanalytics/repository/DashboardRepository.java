package com.arcadeanalytics.repository;

import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.domain.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


/**
 * Spring Data JPA repository for the Dashboard entity.
 */
@SuppressWarnings("unused")
@Repository
public interface DashboardRepository extends JpaRepository<Dashboard, Long> {

    @Transactional
    Optional<Dashboard> findOneByUuid(UUID uuid);

    @Transactional
    Page<Dashboard> findByWorkspaceUserUserLogin(String currentUserLogin, Pageable pageable);

    @Transactional
    List<Dashboard> findByWorkspaceUserUserLogin(String currentUserLogin);

    @Transactional
    List<Dashboard> findByWorkspace(Workspace workspace);

}
