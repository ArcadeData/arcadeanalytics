package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.ArcadeanalyticsApp;

import com.arcadeanalytics.domain.DataSet;
import com.arcadeanalytics.repository.DataSetRepository;
import com.arcadeanalytics.repository.search.DataSetSearchRepository;
import com.arcadeanalytics.service.dto.DataSetDTO;
import com.arcadeanalytics.service.mapper.DataSetMapper;
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
import org.springframework.web.context.WebApplicationContext;

import javax.persistence.EntityManager;
import java.util.List;

import static com.arcadeanalytics.web.rest.TestUtil.createFormattingConversionService;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for the DataSetResource REST controller.
 *
 * @see DataSetResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class DataSetResourceIntTest {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    @Autowired
    private DataSetRepository dataSetRepository;

    @Autowired
    private DataSetMapper dataSetMapper;

    @Autowired
    private DataSetSearchRepository dataSetSearchRepository;

    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private EntityManager em;

    private MockMvc restDataSetMockMvc;

    private DataSet dataSet;

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final DataSetResource dataSetResource = new DataSetResource(dataSetRepository, dataSetMapper, dataSetSearchRepository);
        this.restDataSetMockMvc = MockMvcBuilders.standaloneSetup(dataSetResource)
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
    public static DataSet createEntity(EntityManager em) {
        DataSet dataSet = new DataSet()
            .name(DEFAULT_NAME);
        return dataSet;
    }

    @Before
    public void initTest() {
        dataSetSearchRepository.deleteAll();
        dataSet = createEntity(em);
    }

    @Test
    @Transactional
    public void createDataSet() throws Exception {
        int databaseSizeBeforeCreate = dataSetRepository.findAll().size();

        // Create the DataSet
        DataSetDTO dataSetDTO = dataSetMapper.toDto(dataSet);
        restDataSetMockMvc.perform(post("/api/data-sets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetDTO)))
            .andExpect(status().isCreated());

        // Validate the DataSet in the database
        List<DataSet> dataSetList = dataSetRepository.findAll();
        assertThat(dataSetList).hasSize(databaseSizeBeforeCreate + 1);
        DataSet testDataSet = dataSetList.get(dataSetList.size() - 1);
        assertThat(testDataSet.getName()).isEqualTo(DEFAULT_NAME);

        // Validate the DataSet in Elasticsearch
        DataSet dataSetEs = dataSetSearchRepository.findOne(testDataSet.getId());
        assertThat(dataSetEs).isEqualToComparingFieldByField(testDataSet);
    }

    @Test
    @Transactional
    public void createDataSetWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = dataSetRepository.findAll().size();

        // Create the DataSet with an existing ID
        dataSet.setId(1L);
        DataSetDTO dataSetDTO = dataSetMapper.toDto(dataSet);

        // An entity with an existing ID cannot be created, so this API call must fail
        restDataSetMockMvc.perform(post("/api/data-sets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetDTO)))
            .andExpect(status().isBadRequest());

        // Validate the DataSet in the database
        List<DataSet> dataSetList = dataSetRepository.findAll();
        assertThat(dataSetList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void checkNameIsRequired() throws Exception {
        int databaseSizeBeforeTest = dataSetRepository.findAll().size();
        // set the field null
        dataSet.setName(null);

        // Create the DataSet, which fails.
        DataSetDTO dataSetDTO = dataSetMapper.toDto(dataSet);

        restDataSetMockMvc.perform(post("/api/data-sets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetDTO)))
            .andExpect(status().isBadRequest());

        List<DataSet> dataSetList = dataSetRepository.findAll();
        assertThat(dataSetList).hasSize(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    public void getAllDataSets() throws Exception {
        // Initialize the database
        dataSetRepository.saveAndFlush(dataSet);


        restDataSetMockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();


        // Get all the dataSetList
        restDataSetMockMvc.perform(get("/api/data-sets?sort=id,desc")
            .with(user("admin").roles("ADMIN")))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(dataSet.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())));
    }

    @Test
    @Transactional
    public void getDataSet() throws Exception {
        // Initialize the database
        dataSetRepository.saveAndFlush(dataSet);

        // Get the dataSet
        restDataSetMockMvc.perform(get("/api/data-sets/{id}", dataSet.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.id").value(dataSet.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME.toString()));
    }

    @Test
    @Transactional
    public void getNonExistingDataSet() throws Exception {
        // Get the dataSet
        restDataSetMockMvc.perform(get("/api/data-sets/{id}", Long.MAX_VALUE))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateDataSet() throws Exception {
        // Initialize the database
        dataSetRepository.saveAndFlush(dataSet);
        dataSetSearchRepository.save(dataSet);
        int databaseSizeBeforeUpdate = dataSetRepository.findAll().size();

        // Update the dataSet
        DataSet updatedDataSet = dataSetRepository.findOne(dataSet.getId());
        // Disconnect from session so that the updates on updatedDataSet are not directly saved in db
        em.detach(updatedDataSet);
        updatedDataSet
            .name(UPDATED_NAME);
        DataSetDTO dataSetDTO = dataSetMapper.toDto(updatedDataSet);

        restDataSetMockMvc.perform(put("/api/data-sets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetDTO)))
            .andExpect(status().isOk());

        // Validate the DataSet in the database
        List<DataSet> dataSetList = dataSetRepository.findAll();
        assertThat(dataSetList).hasSize(databaseSizeBeforeUpdate);
        DataSet testDataSet = dataSetList.get(dataSetList.size() - 1);
        assertThat(testDataSet.getName()).isEqualTo(UPDATED_NAME);

        // Validate the DataSet in Elasticsearch
        DataSet dataSetEs = dataSetSearchRepository.findOne(testDataSet.getId());
        assertThat(dataSetEs).isEqualToComparingFieldByField(testDataSet);
    }

    @Test
    @Transactional
    public void updateNonExistingDataSet() throws Exception {
        int databaseSizeBeforeUpdate = dataSetRepository.findAll().size();

        // Create the DataSet
        DataSetDTO dataSetDTO = dataSetMapper.toDto(dataSet);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restDataSetMockMvc.perform(put("/api/data-sets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetDTO)))
            .andExpect(status().isCreated());

        // Validate the DataSet in the database
        List<DataSet> dataSetList = dataSetRepository.findAll();
        assertThat(dataSetList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteDataSet() throws Exception {
        // Initialize the database
        dataSetRepository.saveAndFlush(dataSet);
        dataSetSearchRepository.save(dataSet);
        int databaseSizeBeforeDelete = dataSetRepository.findAll().size();

        // Get the dataSet
        restDataSetMockMvc.perform(delete("/api/data-sets/{id}", dataSet.getId())
            .accept(TestUtil.APPLICATION_JSON_UTF8))
            .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean dataSetExistsInEs = dataSetSearchRepository.exists(dataSet.getId());
        assertThat(dataSetExistsInEs).isFalse();

        // Validate the database is empty
        List<DataSet> dataSetList = dataSetRepository.findAll();
        assertThat(dataSetList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchDataSet() throws Exception {
        // Initialize the database
        dataSetRepository.saveAndFlush(dataSet);
        dataSetSearchRepository.save(dataSet);

        // Search the dataSet
        restDataSetMockMvc.perform(get("/api/_search/data-sets?query=id:" + dataSet.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(dataSet.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())));
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSet.class);
        DataSet dataSet1 = new DataSet();
        dataSet1.setId(1L);
        DataSet dataSet2 = new DataSet();
        dataSet2.setId(dataSet1.getId());
        assertThat(dataSet1).isEqualTo(dataSet2);
        dataSet2.setId(2L);
        assertThat(dataSet1).isNotEqualTo(dataSet2);
        dataSet1.setId(null);
        assertThat(dataSet1).isNotEqualTo(dataSet2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSetDTO.class);
        DataSetDTO dataSetDTO1 = new DataSetDTO();
        dataSetDTO1.setId(1L);
        DataSetDTO dataSetDTO2 = new DataSetDTO();
        assertThat(dataSetDTO1).isNotEqualTo(dataSetDTO2);
        dataSetDTO2.setId(dataSetDTO1.getId());
        assertThat(dataSetDTO1).isEqualTo(dataSetDTO2);
        dataSetDTO2.setId(2L);
        assertThat(dataSetDTO1).isNotEqualTo(dataSetDTO2);
        dataSetDTO1.setId(null);
        assertThat(dataSetDTO1).isNotEqualTo(dataSetDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(dataSetMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(dataSetMapper.fromId(null)).isNull();
    }
}
