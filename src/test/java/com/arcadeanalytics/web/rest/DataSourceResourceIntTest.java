package com.arcadeanalytics.web.rest;

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

import com.arcadeanalytics.ArcadeanalyticsApp;
import com.arcadeanalytics.domain.ArcadeUser;
import com.arcadeanalytics.domain.Company;
import com.arcadeanalytics.domain.Contract;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.User;
import com.arcadeanalytics.domain.Workspace;
import com.arcadeanalytics.domain.enumeration.ContractType;
import com.arcadeanalytics.domain.enumeration.DataSourceType;
import com.arcadeanalytics.domain.enumeration.IndexingStatus;
import com.arcadeanalytics.provider.DataSourceGraphDataProvider;
import com.arcadeanalytics.provider.DataSourceMetadataProvider;
import com.arcadeanalytics.provider.DataSourceProviderFactory;
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.repository.UserRepository;
import com.arcadeanalytics.repository.search.DataSourceSearchRepository;
import com.arcadeanalytics.repository.search.WorkspaceSearchRepository;
import com.arcadeanalytics.service.dto.DataSourceDTO;
import com.arcadeanalytics.service.mapper.DataSourceMapper;
import com.arcadeanalytics.web.rest.errors.ExceptionTranslator;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import javax.persistence.EntityManager;
import java.util.List;

import static com.arcadeanalytics.web.rest.TestUtil.createFormattingConversionService;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for the DataSourceResource REST controller.
 *
 * @see DataSourceResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class DataSourceResourceIntTest {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIPTION = "BBBBBBBBBB";

    private static final DataSourceType DEFAULT_TYPE = DataSourceType.ORIENTDB;
    private static final DataSourceType UPDATED_TYPE = DataSourceType.GREMLIN_ORIENTDB;

    private static final IndexingStatus DEFAULT_INDEXING = IndexingStatus.NOT_INDEXED;
    private static final IndexingStatus UPDATED_INDEXING = IndexingStatus.INDEXING;

    private static final String DEFAULT_SERVER = "AAAAAAAAAA";
    private static final String UPDATED_SERVER = "BBBBBBBBBB";

    private static final Integer DEFAULT_PORT = 1;
    private static final Integer UPDATED_PORT = 2;

    private static final String DEFAULT_DATABASE = "AAAAAAAAAA";
    private static final String UPDATED_DATABASE = "BBBBBBBBBB";

    private static final String DEFAULT_USERNAME = "AAAAAAAAAA";
    private static final String UPDATED_USERNAME = "BBBBBBBBBB";

    private static final String DEFAULT_PASSWORD = "AAAAAAAAAA";
    private static final String UPDATED_PASSWORD = "BBBBBBBBBB";

    private static final Boolean DEFAULT_REMOTE = false;
    private static final Boolean UPDATED_REMOTE = true;

    private static final String DEFAULT_GATEWAY = "AAAAAAAAAA";
    private static final String UPDATED_GATEWAY = "BBBBBBBBBB";

    private static final Integer DEFAULT_SSH_PORT = 1;
    private static final Integer UPDATED_SSH_PORT = 2;

    @Autowired
    private DataSourceRepository dataSourceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DataSourceMapper dataSourceMapper;

    @Autowired
    private DataSourceSearchRepository dataSourceSearchRepository;

    @Autowired
    private WorkspaceSearchRepository workspaceSearchRepository;

    @Autowired
    private ArcadeUserRepository arcadeUserRepository;

    @Autowired
    private CacheManager cacheManager;
    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private EntityManager em;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private DataSourceProviderFactory<DataSourceGraphDataProvider> dataSourceGraphDataProviderFactory;
    @Autowired
    private DataSourceProviderFactory<DataSourceMetadataProvider> dataSourceMetadataProviderFactory;

    private MockMvc restDataSourceMockMvc;

    private DataSource dataSource;


    public DataSource createEntity(EntityManager em) {

        final User user = userRepository.findOneByLogin("user").get();
        Contract contract = new Contract()
                .name("FREE")
                .type(ContractType.FREE)
                .maxWorkspaces(1)
                .maxTraversal(300)
                .maxElements(300)
                .maxDashboards(1)
                .maxWorkspaces(1);
        em.persist(contract);

        Company company = new Company()
                .name("company")
                .contract(contract);
        em.persist(company);

        final ArcadeUser arcadeUser = new ArcadeUser();
        arcadeUser.setUser(user);
        arcadeUser.company(company);
        em.persist(arcadeUser);

        Workspace workspace = new Workspace()
                .name(DEFAULT_NAME)
                .description(DEFAULT_DESCRIPTION)
                .user(arcadeUser);
        em.persist(workspace);

        DataSource dataSource = new DataSource()
                .name(DEFAULT_NAME)
                .description(DEFAULT_DESCRIPTION)
                .type(DEFAULT_TYPE)
                .indexing(DEFAULT_INDEXING)
                .server(DEFAULT_SERVER)
                .port(DEFAULT_PORT)
                .database(DEFAULT_DATABASE)
                .username(DEFAULT_USERNAME)
                .password(DEFAULT_PASSWORD)
                .remote(DEFAULT_REMOTE)
                .gateway(DEFAULT_GATEWAY)
                .sshPort(DEFAULT_SSH_PORT)
                .workspace(workspace);

        return dataSource;
    }

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final DataSourceResource dataSourceResource = new DataSourceResource(dataSourceRepository,
                dataSourceMapper,
                dataSourceSearchRepository,
                cacheManager,
                dataSourceGraphDataProviderFactory,
                dataSourceMetadataProviderFactory);
        this.restDataSourceMockMvc = MockMvcBuilders.standaloneSetup(dataSourceResource)
                .setCustomArgumentResolvers(pageableArgumentResolver)
                .setControllerAdvice(exceptionTranslator)
                .setConversionService(createFormattingConversionService())
                .setMessageConverters(jacksonMessageConverter).build();

    }

    @Before
    public void initTest() {
        dataSourceSearchRepository.deleteAll();
        dataSource = createEntity(em);
    }

    @Test
    @Transactional
    public void createDataSource() throws Exception {
        int databaseSizeBeforeCreate = dataSourceRepository.findAll().size();

        // Create the DataSource
        DataSourceDTO dataSourceDTO = dataSourceMapper.toDto(dataSource);
        restDataSourceMockMvc.perform(post("/api/data-sources")
                .contentType(TestUtil.APPLICATION_JSON_UTF8)
                .content(TestUtil.convertObjectToJsonBytes(dataSourceDTO)))
                .andExpect(status().isCreated());

        // Validate the DataSource in the database
        List<DataSource> dataSourceList = dataSourceRepository.findAll();
        assertThat(dataSourceList).hasSize(databaseSizeBeforeCreate + 1);
        DataSource testDataSource = dataSourceList.get(dataSourceList.size() - 1);
        assertThat(testDataSource.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testDataSource.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testDataSource.getType()).isEqualTo(DEFAULT_TYPE);
        assertThat(testDataSource.getIndexing()).isEqualTo(DEFAULT_INDEXING);
        assertThat(testDataSource.getServer()).isEqualTo(DEFAULT_SERVER);
        assertThat(testDataSource.getPort()).isEqualTo(DEFAULT_PORT);
        assertThat(testDataSource.getDatabase()).isEqualTo(DEFAULT_DATABASE);
        assertThat(testDataSource.getUsername()).isEqualTo(DEFAULT_USERNAME);
        assertThat(testDataSource.getPassword()).isEqualTo(DEFAULT_PASSWORD);
        assertThat(testDataSource.isRemote()).isEqualTo(DEFAULT_REMOTE);
        assertThat(testDataSource.getGateway()).isEqualTo(DEFAULT_GATEWAY);
        assertThat(testDataSource.getSshPort()).isEqualTo(DEFAULT_SSH_PORT);

        // Validate the DataSource in Elasticsearch
        DataSource dataSourceEs = dataSourceSearchRepository.findOne(testDataSource.getId());
        assertThat(dataSourceEs).isEqualToComparingFieldByField(testDataSource);
    }

    @Test
    @Transactional
    public void testDataSourceConnection() throws Exception {

        // Create the DataSource
        DataSourceDTO dataSourceDTO = dataSourceMapper.toDto(dataSource);
        final ResultActions resultActions = restDataSourceMockMvc.perform(post("/api/data-sources/test")
                .contentType(TestUtil.APPLICATION_JSON_UTF8)
                .content(TestUtil.convertObjectToJsonBytes(dataSourceDTO)))
                .andExpect(status().isInternalServerError());

    }

    @Test
    @Transactional
    public void createDataSourceWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = dataSourceRepository.findAll().size();

        // Create the DataSource with an existing ID
        dataSource.setId(1L);
        DataSourceDTO dataSourceDTO = dataSourceMapper.toDto(dataSource);

        // An entity with an existing ID cannot be created, so this API call must fail
        restDataSourceMockMvc.perform(post("/api/data-sources")
                .contentType(TestUtil.APPLICATION_JSON_UTF8)
                .content(TestUtil.convertObjectToJsonBytes(dataSourceDTO)))
                .andExpect(status().isBadRequest());

        // Validate the DataSource in the database
        List<DataSource> dataSourceList = dataSourceRepository.findAll();
        assertThat(dataSourceList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void checkNameIsRequired() throws Exception {
        int databaseSizeBeforeTest = dataSourceRepository.findAll().size();
        // set the field null
        dataSource.setName(null);

        // Create the DataSource, which fails.
        DataSourceDTO dataSourceDTO = dataSourceMapper.toDto(dataSource);

        restDataSourceMockMvc.perform(post("/api/data-sources")
                .contentType(TestUtil.APPLICATION_JSON_UTF8)
                .content(TestUtil.convertObjectToJsonBytes(dataSourceDTO)))
                .andExpect(status().isBadRequest());

        List<DataSource> dataSourceList = dataSourceRepository.findAll();
        assertThat(dataSourceList).hasSize(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    @WithMockUser
    public void getAllDataSources() throws Exception {
        // Initialize the database
        dataSourceRepository.saveAndFlush(dataSource);
        restDataSourceMockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        // Get all the dataSourceList
        restDataSourceMockMvc.perform(get("/api/data-sources?sort=id,desc"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
                .andExpect(jsonPath("$.[*].id").value(hasItem(dataSource.getId().intValue())))
                .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())))
                .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION.toString())))
                .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
                .andExpect(jsonPath("$.[*].indexing").value(hasItem(DEFAULT_INDEXING.toString())))
                .andExpect(jsonPath("$.[*].server").value(hasItem(DEFAULT_SERVER.toString())))
                .andExpect(jsonPath("$.[*].port").value(hasItem(DEFAULT_PORT)))
                .andExpect(jsonPath("$.[*].database").value(hasItem(DEFAULT_DATABASE.toString())))
                .andExpect(jsonPath("$.[*].username").value(hasItem(DEFAULT_USERNAME.toString())))
                .andExpect(jsonPath("$.[*].password").value(hasItem(DEFAULT_PASSWORD.toString())))
                .andExpect(jsonPath("$.[*].remote").value(hasItem(DEFAULT_REMOTE.booleanValue())))
                .andExpect(jsonPath("$.[*].gateway").value(hasItem(DEFAULT_GATEWAY.toString())))
                .andExpect(jsonPath("$.[*].sshPort").value(hasItem(DEFAULT_SSH_PORT)));
    }

    @Test
    @Transactional
    public void getDataSource() throws Exception {
        // Initialize the database
        dataSourceRepository.saveAndFlush(dataSource);

        // Get the dataSource
        restDataSourceMockMvc.perform(get("/api/data-sources/{id}", dataSource.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
                .andExpect(jsonPath("$.id").value(dataSource.getId().intValue()))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME.toString()))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION.toString()))
                .andExpect(jsonPath("$.type").value(DEFAULT_TYPE.toString()))
                .andExpect(jsonPath("$.indexing").value(DEFAULT_INDEXING.toString()))
                .andExpect(jsonPath("$.server").value(DEFAULT_SERVER.toString()))
                .andExpect(jsonPath("$.port").value(DEFAULT_PORT))
                .andExpect(jsonPath("$.database").value(DEFAULT_DATABASE.toString()))
                .andExpect(jsonPath("$.username").value(DEFAULT_USERNAME.toString()))
                .andExpect(jsonPath("$.password").value(DEFAULT_PASSWORD.toString()))
                .andExpect(jsonPath("$.remote").value(DEFAULT_REMOTE.booleanValue()))
                .andExpect(jsonPath("$.gateway").value(DEFAULT_GATEWAY.toString()))
                .andExpect(jsonPath("$.sshPort").value(DEFAULT_SSH_PORT));
    }

    @Test
    @Transactional
    @Ignore
    public void getDataSourceMetadata() throws Exception {
        // Initialize the database
        dataSourceRepository.saveAndFlush(dataSource);

        restDataSourceMockMvc.perform(get("/api/data-sources/metadata/{id}", dataSource.getId()))
                .andDo(MockMvcResultHandlers.print());


        // Get the dataSource
        restDataSourceMockMvc.perform(get("/api/data-sources/metadata/{id}", dataSource.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
                .andExpect(jsonPath("$.id").value(dataSource.getId().intValue()))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME.toString()))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION.toString()))
                .andExpect(jsonPath("$.type").value(DEFAULT_TYPE.toString()))
                .andExpect(jsonPath("$.indexing").value(DEFAULT_INDEXING.toString()))
                .andExpect(jsonPath("$.server").value(DEFAULT_SERVER.toString()))
                .andExpect(jsonPath("$.port").value(DEFAULT_PORT))
                .andExpect(jsonPath("$.database").value(DEFAULT_DATABASE.toString()))
                .andExpect(jsonPath("$.username").value(DEFAULT_USERNAME.toString()))
                .andExpect(jsonPath("$.password").value(DEFAULT_PASSWORD.toString()))
                .andExpect(jsonPath("$.remote").value(DEFAULT_REMOTE.booleanValue()))
                .andExpect(jsonPath("$.gateway").value(DEFAULT_GATEWAY.toString()))
                .andExpect(jsonPath("$.sshPort").value(DEFAULT_SSH_PORT));
    }

    @Test
    @Transactional
    public void getNonExistingDataSource() throws Exception {
        // Get the dataSource
        restDataSourceMockMvc.perform(get("/api/data-sources/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateDataSource() throws Exception {
        // Initialize the database
        dataSourceRepository.saveAndFlush(dataSource);
        dataSourceSearchRepository.save(dataSource);
        int databaseSizeBeforeUpdate = dataSourceRepository.findAll().size();

        // Update the dataSource
        DataSource updatedDataSource = dataSourceRepository.findOne(dataSource.getId());
        // Disconnect from session so that the updates on updatedDataSource are not directly saved in db
        em.detach(updatedDataSource);
        updatedDataSource
                .name(UPDATED_NAME)
                .description(UPDATED_DESCRIPTION)
                .type(UPDATED_TYPE)
                .indexing(UPDATED_INDEXING)
                .server(UPDATED_SERVER)
                .port(UPDATED_PORT)
                .database(UPDATED_DATABASE)
                .username(UPDATED_USERNAME)
                .password(UPDATED_PASSWORD)
                .remote(UPDATED_REMOTE)
                .gateway(UPDATED_GATEWAY)
                .sshPort(UPDATED_SSH_PORT);
        DataSourceDTO dataSourceDTO = dataSourceMapper.toDto(updatedDataSource);

        restDataSourceMockMvc.perform(put("/api/data-sources")
                .contentType(TestUtil.APPLICATION_JSON_UTF8)
                .content(TestUtil.convertObjectToJsonBytes(dataSourceDTO)))
                .andExpect(status().isOk());

        // Validate the DataSource in the database
        List<DataSource> dataSourceList = dataSourceRepository.findAll();
        assertThat(dataSourceList).hasSize(databaseSizeBeforeUpdate);
        DataSource testDataSource = dataSourceList.get(dataSourceList.size() - 1);
        assertThat(testDataSource.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testDataSource.getDescription()).isEqualTo(UPDATED_DESCRIPTION);
        assertThat(testDataSource.getType()).isEqualTo(UPDATED_TYPE);
        assertThat(testDataSource.getIndexing()).isEqualTo(UPDATED_INDEXING);
        assertThat(testDataSource.getServer()).isEqualTo(UPDATED_SERVER);
        assertThat(testDataSource.getPort()).isEqualTo(UPDATED_PORT);
        assertThat(testDataSource.getDatabase()).isEqualTo(UPDATED_DATABASE);
        assertThat(testDataSource.getUsername()).isEqualTo(UPDATED_USERNAME);
        assertThat(testDataSource.getPassword()).isEqualTo(UPDATED_PASSWORD);
        assertThat(testDataSource.isRemote()).isEqualTo(UPDATED_REMOTE);
        assertThat(testDataSource.getGateway()).isEqualTo(UPDATED_GATEWAY);
        assertThat(testDataSource.getSshPort()).isEqualTo(UPDATED_SSH_PORT);

        // Validate the DataSource in Elasticsearch
        DataSource dataSourceEs = dataSourceSearchRepository.findOne(testDataSource.getId());
        assertThat(dataSourceEs).isEqualToComparingFieldByField(testDataSource);
    }

    @Test
    @Transactional
    public void updateNonExistingDataSource() throws Exception {
        int databaseSizeBeforeUpdate = dataSourceRepository.findAll().size();

        // Create the DataSource
        DataSourceDTO dataSourceDTO = dataSourceMapper.toDto(dataSource);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restDataSourceMockMvc.perform(put("/api/data-sources")
                .contentType(TestUtil.APPLICATION_JSON_UTF8)
                .content(TestUtil.convertObjectToJsonBytes(dataSourceDTO)))
                .andExpect(status().isCreated());

        // Validate the DataSource in the database
        List<DataSource> dataSourceList = dataSourceRepository.findAll();
        assertThat(dataSourceList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteDataSource() throws Exception {
        // Initialize the database
        dataSourceRepository.saveAndFlush(dataSource);
        dataSourceSearchRepository.save(dataSource);
        int databaseSizeBeforeDelete = dataSourceRepository.findAll().size();

        // Get the dataSource
        restDataSourceMockMvc.perform(delete("/api/data-sources/{id}", dataSource.getId())
                .accept(TestUtil.APPLICATION_JSON_UTF8))
                .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean dataSourceExistsInEs = dataSourceSearchRepository.exists(dataSource.getId());
        assertThat(dataSourceExistsInEs).isFalse();

        // Validate the database is empty
        List<DataSource> dataSourceList = dataSourceRepository.findAll();
        assertThat(dataSourceList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchDataSource() throws Exception {
        // Initialize the database
        dataSourceRepository.saveAndFlush(dataSource);
        dataSourceSearchRepository.save(dataSource);

        // Search the dataSource
        restDataSourceMockMvc.perform(get("/api/_search/data-sources?query=id:" + dataSource.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
                .andExpect(jsonPath("$.[*].id").value(hasItem(dataSource.getId().intValue())))
                .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())))
                .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION.toString())))
                .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
                .andExpect(jsonPath("$.[*].indexing").value(hasItem(DEFAULT_INDEXING.toString())))
                .andExpect(jsonPath("$.[*].server").value(hasItem(DEFAULT_SERVER.toString())))
                .andExpect(jsonPath("$.[*].port").value(hasItem(DEFAULT_PORT)))
                .andExpect(jsonPath("$.[*].database").value(hasItem(DEFAULT_DATABASE.toString())))
                .andExpect(jsonPath("$.[*].username").value(hasItem(DEFAULT_USERNAME.toString())))
                .andExpect(jsonPath("$.[*].password").value(hasItem(DEFAULT_PASSWORD.toString())))
                .andExpect(jsonPath("$.[*].remote").value(hasItem(DEFAULT_REMOTE.booleanValue())))
                .andExpect(jsonPath("$.[*].gateway").value(hasItem(DEFAULT_GATEWAY.toString())))
                .andExpect(jsonPath("$.[*].sshPort").value(hasItem(DEFAULT_SSH_PORT)));
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSource.class);
        DataSource dataSource1 = new DataSource();
        dataSource1.setId(1L);
        DataSource dataSource2 = new DataSource();
        dataSource2.setId(dataSource1.getId());
        assertThat(dataSource1).isEqualTo(dataSource2);
        dataSource2.setId(2L);
        assertThat(dataSource1).isNotEqualTo(dataSource2);
        dataSource1.setId(null);
        assertThat(dataSource1).isNotEqualTo(dataSource2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSourceDTO.class);
        DataSourceDTO dataSourceDTO1 = new DataSourceDTO();
        dataSourceDTO1.setId(1L);
        DataSourceDTO dataSourceDTO2 = new DataSourceDTO();
        assertThat(dataSourceDTO1).isNotEqualTo(dataSourceDTO2);
        dataSourceDTO2.setId(dataSourceDTO1.getId());
        assertThat(dataSourceDTO1).isEqualTo(dataSourceDTO2);
        dataSourceDTO2.setId(2L);
        assertThat(dataSourceDTO1).isNotEqualTo(dataSourceDTO2);
        dataSourceDTO1.setId(null);
        assertThat(dataSourceDTO1).isNotEqualTo(dataSourceDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(dataSourceMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(dataSourceMapper.fromId(null)).isNull();
    }
}
