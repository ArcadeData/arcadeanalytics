package com.arcadeanalytics.repository;

/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.domain.Widget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


/**
 * Spring Data JPA repository for the Widget entity.
 */
@SuppressWarnings("unused")
@Repository
public interface WidgetRepository extends JpaRepository<Widget, Long> {


    Page<Widget> findByDashboardWorkspaceUserUserLogin(String currentUserLogin, Pageable pageable);

    List<Widget> findByDashboardWorkspaceUserUserLogin(String currentUserLogin);

    Page<Widget> findByDashboardId(Long dashboardId, Pageable pageable);

    List<Widget> findByDashboard(Dashboard dashboard);

    Optional<Widget> findOneByUuid(UUID uuid);

}
