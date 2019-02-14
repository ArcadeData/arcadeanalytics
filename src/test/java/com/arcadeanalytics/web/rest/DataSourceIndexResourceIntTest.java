package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.ArcadeanalyticsApp;

import com.arcadeanalytics.domain.DataSourceIndex;
import com.arcadeanalytics.repository.DataSourceIndexRepository;
import com.arcadeanalytics.repository.search.DataSourceIndexSearchRepository;
import com.arcadeanalytics.service.dto.DataSourceIndexDTO;
import com.arcadeanalytics.service.mapper.DataSourceIndexMapper;
import com.arcadeanalytics.web.rest.errors.ExceptionTranslator;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static com.arcadeanalytics.web.rest.TestUtil.createFormattingConversionService;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for the DataSourceIndexResource REST controller.
 *
 * @see DataSourceIndexResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class DataSourceIndexResourceIntTest {

    private static final LocalDate DEFAULT_STARTED_AT = LocalDate.ofEpochDay(0L);
    private static final LocalDate UPDATED_STARTED_AT = LocalDate.now(ZoneId.systemDefault());

    private static final LocalDate DEFAULT_ENDED_AT = LocalDate.ofEpochDay(0L);
    private static final LocalDate UPDATED_ENDED_AT = LocalDate.now(ZoneId.systemDefault());

    private static final Long DEFAULT_DOCUMENTS = 1L;
    private static final Long UPDATED_DOCUMENTS = 2L;

    private static final Boolean DEFAULT_STATUS = false;
    private static final Boolean UPDATED_STATUS = true;

    private static final String DEFAULT_REPORT = "AAAAAAAAAA";
    private static final String UPDATED_REPORT = "BBBBBBBBBB";

    @Autowired
    private DataSourceIndexRepository dataSourceIndexRepository;

    @Autowired
    private DataSourceIndexMapper dataSourceIndexMapper;

    @Autowired
    private DataSourceIndexSearchRepository dataSourceIndexSearchRepository;

    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private EntityManager em;

    private MockMvc restDataSourceIndexMockMvc;

    private DataSourceIndex dataSourceIndex;

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final DataSourceIndexResource dataSourceIndexResource = new DataSourceIndexResource(dataSourceIndexRepository, dataSourceIndexMapper, dataSourceIndexSearchRepository);
        this.restDataSourceIndexMockMvc = MockMvcBuilders.standaloneSetup(dataSourceIndexResource)
            .setCustomArgumentResolvers(pageableArgumentResolver)
            .setControllerAdvice(exceptionTranslator)
            .setConversionService(createFormattingConversionService())
            .setMessageConverters(jacksonMessageConverter).build();
    }

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static DataSourceIndex createEntity(EntityManager em) {
        DataSourceIndex dataSourceIndex = new DataSourceIndex()
            .startedAt(DEFAULT_STARTED_AT)
            .endedAt(DEFAULT_ENDED_AT)
            .documents(DEFAULT_DOCUMENTS)
            .status(DEFAULT_STATUS)
            .report(DEFAULT_REPORT);
        return dataSourceIndex;
    }

    @Before
    public void initTest() {
        dataSourceIndexSearchRepository.deleteAll();
        dataSourceIndex = createEntity(em);
    }

    @Test
    @Transactional
    public void createDataSourceIndex() throws Exception {
        int databaseSizeBeforeCreate = dataSourceIndexRepository.findAll().size();

        // Create the DataSourceIndex
        DataSourceIndexDTO dataSourceIndexDTO = dataSourceIndexMapper.toDto(dataSourceIndex);
        restDataSourceIndexMockMvc.perform(post("/api/data-source-indices")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSourceIndexDTO)))
            .andExpect(status().isCreated());

        // Validate the DataSourceIndex in the database
        List<DataSourceIndex> dataSourceIndexList = dataSourceIndexRepository.findAll();
        assertThat(dataSourceIndexList).hasSize(databaseSizeBeforeCreate + 1);
        DataSourceIndex testDataSourceIndex = dataSourceIndexList.get(dataSourceIndexList.size() - 1);
        assertThat(testDataSourceIndex.getStartedAt()).isEqualTo(DEFAULT_STARTED_AT);
        assertThat(testDataSourceIndex.getEndedAt()).isEqualTo(DEFAULT_ENDED_AT);
        assertThat(testDataSourceIndex.getDocuments()).isEqualTo(DEFAULT_DOCUMENTS);
        assertThat(testDataSourceIndex.isStatus()).isEqualTo(DEFAULT_STATUS);
        assertThat(testDataSourceIndex.getReport()).isEqualTo(DEFAULT_REPORT);

        // Validate the DataSourceIndex in Elasticsearch
        DataSourceIndex dataSourceIndexEs = dataSourceIndexSearchRepository.findOne(testDataSourceIndex.getId());
        assertThat(dataSourceIndexEs).isEqualToComparingFieldByField(testDataSourceIndex);
    }

    @Test
    @Transactional
    public void createDataSourceIndexWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = dataSourceIndexRepository.findAll().size();

        // Create the DataSourceIndex with an existing ID
        dataSourceIndex.setId(1L);
        DataSourceIndexDTO dataSourceIndexDTO = dataSourceIndexMapper.toDto(dataSourceIndex);

        // An entity with an existing ID cannot be created, so this API call must fail
        restDataSourceIndexMockMvc.perform(post("/api/data-source-indices")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSourceIndexDTO)))
            .andExpect(status().isBadRequest());

        // Validate the DataSourceIndex in the database
        List<DataSourceIndex> dataSourceIndexList = dataSourceIndexRepository.findAll();
        assertThat(dataSourceIndexList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void checkStartedAtIsRequired() throws Exception {
        int databaseSizeBeforeTest = dataSourceIndexRepository.findAll().size();
        // set the field null
        dataSourceIndex.setStartedAt(null);

        // Create the DataSourceIndex, which fails.
        DataSourceIndexDTO dataSourceIndexDTO = dataSourceIndexMapper.toDto(dataSourceIndex);

        restDataSourceIndexMockMvc.perform(post("/api/data-source-indices")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSourceIndexDTO)))
            .andExpect(status().isBadRequest());

        List<DataSourceIndex> dataSourceIndexList = dataSourceIndexRepository.findAll();
        assertThat(dataSourceIndexList).hasSize(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    public void getAllDataSourceIndices() throws Exception {
        // Initialize the database
        dataSourceIndexRepository.saveAndFlush(dataSourceIndex);

        // Get all the dataSourceIndexList
        restDataSourceIndexMockMvc.perform(get("/api/data-source-indices?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(dataSourceIndex.getId().intValue())))
            .andExpect(jsonPath("$.[*].startedAt").value(hasItem(DEFAULT_STARTED_AT.toString())))
            .andExpect(jsonPath("$.[*].endedAt").value(hasItem(DEFAULT_ENDED_AT.toString())))
            .andExpect(jsonPath("$.[*].documents").value(hasItem(DEFAULT_DOCUMENTS.intValue())))
            .andExpect(jsonPath("$.[*].status").value(hasItem(DEFAULT_STATUS.booleanValue())))
            .andExpect(jsonPath("$.[*].report").value(hasItem(DEFAULT_REPORT.toString())));
    }

    @Test
    @Transactional
    public void getDataSourceIndex() throws Exception {
        // Initialize the database
        dataSourceIndexRepository.saveAndFlush(dataSourceIndex);

        // Get the dataSourceIndex
        restDataSourceIndexMockMvc.perform(get("/api/data-source-indices/{id}", dataSourceIndex.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.id").value(dataSourceIndex.getId().intValue()))
            .andExpect(jsonPath("$.startedAt").value(DEFAULT_STARTED_AT.toString()))
            .andExpect(jsonPath("$.endedAt").value(DEFAULT_ENDED_AT.toString()))
            .andExpect(jsonPath("$.documents").value(DEFAULT_DOCUMENTS.intValue()))
            .andExpect(jsonPath("$.status").value(DEFAULT_STATUS.booleanValue()))
            .andExpect(jsonPath("$.report").value(DEFAULT_REPORT.toString()));
    }

    @Test
    @Transactional
    public void getNonExistingDataSourceIndex() throws Exception {
        // Get the dataSourceIndex
        restDataSourceIndexMockMvc.perform(get("/api/data-source-indices/{id}", Long.MAX_VALUE))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateDataSourceIndex() throws Exception {
        // Initialize the database
        dataSourceIndexRepository.saveAndFlush(dataSourceIndex);
        dataSourceIndexSearchRepository.save(dataSourceIndex);
        int databaseSizeBeforeUpdate = dataSourceIndexRepository.findAll().size();

        // Update the dataSourceIndex
        DataSourceIndex updatedDataSourceIndex = dataSourceIndexRepository.findOne(dataSourceIndex.getId());
        // Disconnect from session so that the updates on updatedDataSourceIndex are not directly saved in db
        em.detach(updatedDataSourceIndex);
        updatedDataSourceIndex
            .startedAt(UPDATED_STARTED_AT)
            .endedAt(UPDATED_ENDED_AT)
            .documents(UPDATED_DOCUMENTS)
            .status(UPDATED_STATUS)
            .report(UPDATED_REPORT);
        DataSourceIndexDTO dataSourceIndexDTO = dataSourceIndexMapper.toDto(updatedDataSourceIndex);

        restDataSourceIndexMockMvc.perform(put("/api/data-source-indices")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSourceIndexDTO)))
            .andExpect(status().isOk());

        // Validate the DataSourceIndex in the database
        List<DataSourceIndex> dataSourceIndexList = dataSourceIndexRepository.findAll();
        assertThat(dataSourceIndexList).hasSize(databaseSizeBeforeUpdate);
        DataSourceIndex testDataSourceIndex = dataSourceIndexList.get(dataSourceIndexList.size() - 1);
        assertThat(testDataSourceIndex.getStartedAt()).isEqualTo(UPDATED_STARTED_AT);
        assertThat(testDataSourceIndex.getEndedAt()).isEqualTo(UPDATED_ENDED_AT);
        assertThat(testDataSourceIndex.getDocuments()).isEqualTo(UPDATED_DOCUMENTS);
        assertThat(testDataSourceIndex.isStatus()).isEqualTo(UPDATED_STATUS);
        assertThat(testDataSourceIndex.getReport()).isEqualTo(UPDATED_REPORT);

        // Validate the DataSourceIndex in Elasticsearch
        DataSourceIndex dataSourceIndexEs = dataSourceIndexSearchRepository.findOne(testDataSourceIndex.getId());
        assertThat(dataSourceIndexEs).isEqualToComparingFieldByField(testDataSourceIndex);
    }

    @Test
    @Transactional
    public void updateNonExistingDataSourceIndex() throws Exception {
        int databaseSizeBeforeUpdate = dataSourceIndexRepository.findAll().size();

        // Create the DataSourceIndex
        DataSourceIndexDTO dataSourceIndexDTO = dataSourceIndexMapper.toDto(dataSourceIndex);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restDataSourceIndexMockMvc.perform(put("/api/data-source-indices")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSourceIndexDTO)))
            .andExpect(status().isCreated());

        // Validate the DataSourceIndex in the database
        List<DataSourceIndex> dataSourceIndexList = dataSourceIndexRepository.findAll();
        assertThat(dataSourceIndexList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteDataSourceIndex() throws Exception {
        // Initialize the database
        dataSourceIndexRepository.saveAndFlush(dataSourceIndex);
        dataSourceIndexSearchRepository.save(dataSourceIndex);
        int databaseSizeBeforeDelete = dataSourceIndexRepository.findAll().size();

        // Get the dataSourceIndex
        restDataSourceIndexMockMvc.perform(delete("/api/data-source-indices/{id}", dataSourceIndex.getId())
            .accept(TestUtil.APPLICATION_JSON_UTF8))
            .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean dataSourceIndexExistsInEs = dataSourceIndexSearchRepository.exists(dataSourceIndex.getId());
        assertThat(dataSourceIndexExistsInEs).isFalse();

        // Validate the database is empty
        List<DataSourceIndex> dataSourceIndexList = dataSourceIndexRepository.findAll();
        assertThat(dataSourceIndexList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchDataSourceIndex() throws Exception {
        // Initialize the database
        dataSourceIndexRepository.saveAndFlush(dataSourceIndex);
        dataSourceIndexSearchRepository.save(dataSourceIndex);

        // Search the dataSourceIndex
        restDataSourceIndexMockMvc.perform(get("/api/_search/data-source-indices?query=id:" + dataSourceIndex.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(dataSourceIndex.getId().intValue())))
            .andExpect(jsonPath("$.[*].startedAt").value(hasItem(DEFAULT_STARTED_AT.toString())))
            .andExpect(jsonPath("$.[*].endedAt").value(hasItem(DEFAULT_ENDED_AT.toString())))
            .andExpect(jsonPath("$.[*].documents").value(hasItem(DEFAULT_DOCUMENTS.intValue())))
            .andExpect(jsonPath("$.[*].status").value(hasItem(DEFAULT_STATUS.booleanValue())))
            .andExpect(jsonPath("$.[*].report").value(hasItem(DEFAULT_REPORT.toString())));
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSourceIndex.class);
        DataSourceIndex dataSourceIndex1 = new DataSourceIndex();
        dataSourceIndex1.setId(1L);
        DataSourceIndex dataSourceIndex2 = new DataSourceIndex();
        dataSourceIndex2.setId(dataSourceIndex1.getId());
        assertThat(dataSourceIndex1).isEqualTo(dataSourceIndex2);
        dataSourceIndex2.setId(2L);
        assertThat(dataSourceIndex1).isNotEqualTo(dataSourceIndex2);
        dataSourceIndex1.setId(null);
        assertThat(dataSourceIndex1).isNotEqualTo(dataSourceIndex2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSourceIndexDTO.class);
        DataSourceIndexDTO dataSourceIndexDTO1 = new DataSourceIndexDTO();
        dataSourceIndexDTO1.setId(1L);
        DataSourceIndexDTO dataSourceIndexDTO2 = new DataSourceIndexDTO();
        assertThat(dataSourceIndexDTO1).isNotEqualTo(dataSourceIndexDTO2);
        dataSourceIndexDTO2.setId(dataSourceIndexDTO1.getId());
        assertThat(dataSourceIndexDTO1).isEqualTo(dataSourceIndexDTO2);
        dataSourceIndexDTO2.setId(2L);
        assertThat(dataSourceIndexDTO1).isNotEqualTo(dataSourceIndexDTO2);
        dataSourceIndexDTO1.setId(null);
        assertThat(dataSourceIndexDTO1).isNotEqualTo(dataSourceIndexDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(dataSourceIndexMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(dataSourceIndexMapper.fromId(null)).isNull();
    }
}
