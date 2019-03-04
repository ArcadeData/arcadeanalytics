package com.arcadeanalytics.service;

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

import com.arcadeanalytics.domain.Company;
import com.arcadeanalytics.domain.Contract;
import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.domain.DataSet;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.Media;
import com.arcadeanalytics.domain.User;
import com.arcadeanalytics.domain.Widget;
import com.arcadeanalytics.domain.Workspace;
import com.arcadeanalytics.repository.CompanyRepository;
import com.arcadeanalytics.repository.ContractRepository;
import com.arcadeanalytics.repository.DashboardRepository;
import com.arcadeanalytics.repository.DataSetRepository;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.repository.MediaRepository;
import com.arcadeanalytics.repository.UserRepository;
import com.arcadeanalytics.repository.WidgetRepository;
import com.arcadeanalytics.repository.WorkspaceRepository;
import com.arcadeanalytics.repository.search.CompanySearchRepository;
import com.arcadeanalytics.repository.search.ContractSearchRepository;
import com.arcadeanalytics.repository.search.DashboardSearchRepository;
import com.arcadeanalytics.repository.search.DataSetSearchRepository;
import com.arcadeanalytics.repository.search.DataSourceSearchRepository;
import com.arcadeanalytics.repository.search.MediaSearchRepository;
import com.arcadeanalytics.repository.search.UserSearchRepository;
import com.arcadeanalytics.repository.search.WidgetSearchRepository;
import com.arcadeanalytics.repository.search.WorkspaceSearchRepository;
import com.codahale.metrics.annotation.Timed;
import org.elasticsearch.indices.IndexAlreadyExistsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.elasticsearch.core.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.io.Serializable;
import java.lang.reflect.Method;
import java.util.List;

@Service
public class ElasticsearchIndexService {

    private final Logger log = LoggerFactory.getLogger(ElasticsearchIndexService.class);

    private final DashboardRepository dashboardRepository;

    private final DashboardSearchRepository dashboardSearchRepository;

    private final DataSetRepository dataSetRepository;

    private final DataSetSearchRepository dataSetSearchRepository;

    private final DataSourceRepository dataSourceRepository;

    private final DataSourceSearchRepository dataSourceSearchRepository;

    private final MediaRepository mediaRepository;

    private final MediaSearchRepository mediaSearchRepository;

    private final WidgetRepository widgetRepository;

    private final WidgetSearchRepository widgetSearchRepository;

    private final WorkspaceRepository workspaceRepository;

    private final WorkspaceSearchRepository workspaceSearchRepository;

    private final UserRepository userRepository;

    private final UserSearchRepository userSearchRepository;

    private final CompanyRepository companyRepository;

    private final CompanySearchRepository companySearchRepository;

    private final ContractRepository contractRepository;

    private final ContractSearchRepository contractSearchRepository;

    private final ElasticsearchTemplate elasticsearchTemplate;

    public ElasticsearchIndexService(
            UserRepository userRepository,
            UserSearchRepository userSearchRepository,
            DashboardRepository dashboardRepository,
            DashboardSearchRepository dashboardSearchRepository,
            DataSetRepository dataSetRepository,
            DataSetSearchRepository dataSetSearchRepository,
            DataSourceRepository dataSourceRepository,
            DataSourceSearchRepository dataSourceSearchRepository,
            MediaRepository mediaRepository,
            MediaSearchRepository mediaSearchRepository,
            WidgetRepository widgetRepository,
            WidgetSearchRepository widgetSearchRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceSearchRepository workspaceSearchRepository,
            CompanyRepository companyRepository,
            CompanySearchRepository companySearchRepository,
            ContractRepository contractRepository,
            ContractSearchRepository contractSearchRepository,
            ElasticsearchTemplate elasticsearchTemplate) {
        this.userRepository = userRepository;
        this.userSearchRepository = userSearchRepository;
        this.dashboardRepository = dashboardRepository;
        this.dashboardSearchRepository = dashboardSearchRepository;
        this.dataSetRepository = dataSetRepository;
        this.dataSetSearchRepository = dataSetSearchRepository;
        this.dataSourceRepository = dataSourceRepository;
        this.dataSourceSearchRepository = dataSourceSearchRepository;
        this.mediaRepository = mediaRepository;
        this.mediaSearchRepository = mediaSearchRepository;
        this.widgetRepository = widgetRepository;
        this.widgetSearchRepository = widgetSearchRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceSearchRepository = workspaceSearchRepository;
        this.companyRepository = companyRepository;
        this.companySearchRepository = companySearchRepository;
        this.contractRepository = contractRepository;
        this.contractSearchRepository = contractSearchRepository;
        this.elasticsearchTemplate = elasticsearchTemplate;
    }

    @Async
    @Timed
    @PostConstruct
    public void reindexAll() {
        reindexForClass(Dashboard.class, dashboardRepository, dashboardSearchRepository);
        reindexForClass(DataSet.class, dataSetRepository, dataSetSearchRepository);
        reindexForClass(DataSource.class, dataSourceRepository, dataSourceSearchRepository);
        reindexForClass(Media.class, mediaRepository, mediaSearchRepository);
        reindexForClass(Widget.class, widgetRepository, widgetSearchRepository);
        reindexForClass(Workspace.class, workspaceRepository, workspaceSearchRepository);
        reindexForClass(User.class, userRepository, userSearchRepository);
        reindexForClass(Company.class, companyRepository, companySearchRepository);
        reindexForClass(Contract.class, contractRepository, contractSearchRepository);

        log.info("Elasticsearch: Successfully performed reindexing");
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    private <T, ID extends Serializable> void reindexForClass(Class<T> entityClass,
                                                              JpaRepository<T, ID> jpaRepository,
                                                              ElasticsearchRepository<T, ID> elasticsearchRepository) {
        elasticsearchTemplate.deleteIndex(entityClass);
        try {
            elasticsearchTemplate.createIndex(entityClass);
        } catch (IndexAlreadyExistsException e) {
            // Do nothing. Index was already concurrently recreated by some other service.
        }
        elasticsearchTemplate.putMapping(entityClass);
        if (jpaRepository.count() > 0) {
            try {
                Method m = jpaRepository.getClass().getMethod("findAllWithEagerRelationships");
                elasticsearchRepository.save((List<T>) m.invoke(jpaRepository));
            } catch (Exception e) {
                elasticsearchRepository.save(jpaRepository.findAll());
            }
        }
        log.info("Elasticsearch: Indexed all rows for " + entityClass.getSimpleName());
    }
}
