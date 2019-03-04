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

import com.arcadeanalytics.domain.DataSetOperation;
import com.arcadeanalytics.repository.DataSetOperationRepository;
import com.arcadeanalytics.repository.search.DataSetOperationSearchRepository;
import com.arcadeanalytics.service.dto.DataSetOperationDTO;
import com.arcadeanalytics.service.mapper.DataSetOperationMapper;
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
 * Test class for the DataSetOperationResource REST controller.
 *
 * @see DataSetOperationResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class DataSetOperationResourceIntTest {

    private static final LocalDate DEFAULT_CREATED_AT = LocalDate.ofEpochDay(0L);
    private static final LocalDate UPDATED_CREATED_AT = LocalDate.now(ZoneId.systemDefault());

    private static final String DEFAULT_OPERATION = "AAAAAAAAAA";
    private static final String UPDATED_OPERATION = "BBBBBBBBBB";

    @Autowired
    private DataSetOperationRepository dataSetOperationRepository;

    @Autowired
    private DataSetOperationMapper dataSetOperationMapper;

    @Autowired
    private DataSetOperationSearchRepository dataSetOperationSearchRepository;

    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private EntityManager em;

    private MockMvc restDataSetOperationMockMvc;

    private DataSetOperation dataSetOperation;

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final DataSetOperationResource dataSetOperationResource = new DataSetOperationResource(dataSetOperationRepository, dataSetOperationMapper, dataSetOperationSearchRepository);
        this.restDataSetOperationMockMvc = MockMvcBuilders.standaloneSetup(dataSetOperationResource)
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
    public static DataSetOperation createEntity(EntityManager em) {
        DataSetOperation dataSetOperation = new DataSetOperation()
            .createdAt(DEFAULT_CREATED_AT)
            .operation(DEFAULT_OPERATION);
        return dataSetOperation;
    }

    @Before
    public void initTest() {
        dataSetOperationSearchRepository.deleteAll();
        dataSetOperation = createEntity(em);
    }

    @Test
    @Transactional
    public void createDataSetOperation() throws Exception {
        int databaseSizeBeforeCreate = dataSetOperationRepository.findAll().size();

        // Create the DataSetOperation
        DataSetOperationDTO dataSetOperationDTO = dataSetOperationMapper.toDto(dataSetOperation);
        restDataSetOperationMockMvc.perform(post("/api/data-set-operations")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetOperationDTO)))
            .andExpect(status().isCreated());

        // Validate the DataSetOperation in the database
        List<DataSetOperation> dataSetOperationList = dataSetOperationRepository.findAll();
        assertThat(dataSetOperationList).hasSize(databaseSizeBeforeCreate + 1);
        DataSetOperation testDataSetOperation = dataSetOperationList.get(dataSetOperationList.size() - 1);
        assertThat(testDataSetOperation.getCreatedAt()).isEqualTo(DEFAULT_CREATED_AT);
        assertThat(testDataSetOperation.getOperation()).isEqualTo(DEFAULT_OPERATION);

        // Validate the DataSetOperation in Elasticsearch
        DataSetOperation dataSetOperationEs = dataSetOperationSearchRepository.findOne(testDataSetOperation.getId());
        assertThat(dataSetOperationEs).isEqualToComparingFieldByField(testDataSetOperation);
    }

    @Test
    @Transactional
    public void createDataSetOperationWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = dataSetOperationRepository.findAll().size();

        // Create the DataSetOperation with an existing ID
        dataSetOperation.setId(1L);
        DataSetOperationDTO dataSetOperationDTO = dataSetOperationMapper.toDto(dataSetOperation);

        // An entity with an existing ID cannot be created, so this API call must fail
        restDataSetOperationMockMvc.perform(post("/api/data-set-operations")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetOperationDTO)))
            .andExpect(status().isBadRequest());

        // Validate the DataSetOperation in the database
        List<DataSetOperation> dataSetOperationList = dataSetOperationRepository.findAll();
        assertThat(dataSetOperationList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void checkCreatedAtIsRequired() throws Exception {
        int databaseSizeBeforeTest = dataSetOperationRepository.findAll().size();
        // set the field null
        dataSetOperation.setCreatedAt(null);

        // Create the DataSetOperation, which fails.
        DataSetOperationDTO dataSetOperationDTO = dataSetOperationMapper.toDto(dataSetOperation);

        restDataSetOperationMockMvc.perform(post("/api/data-set-operations")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetOperationDTO)))
            .andExpect(status().isBadRequest());

        List<DataSetOperation> dataSetOperationList = dataSetOperationRepository.findAll();
        assertThat(dataSetOperationList).hasSize(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    public void checkOperationIsRequired() throws Exception {
        int databaseSizeBeforeTest = dataSetOperationRepository.findAll().size();
        // set the field null
        dataSetOperation.setOperation(null);

        // Create the DataSetOperation, which fails.
        DataSetOperationDTO dataSetOperationDTO = dataSetOperationMapper.toDto(dataSetOperation);

        restDataSetOperationMockMvc.perform(post("/api/data-set-operations")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetOperationDTO)))
            .andExpect(status().isBadRequest());

        List<DataSetOperation> dataSetOperationList = dataSetOperationRepository.findAll();
        assertThat(dataSetOperationList).hasSize(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    public void getAllDataSetOperations() throws Exception {
        // Initialize the database
        dataSetOperationRepository.saveAndFlush(dataSetOperation);

        // Get all the dataSetOperationList
        restDataSetOperationMockMvc.perform(get("/api/data-set-operations?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(dataSetOperation.getId().intValue())))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].operation").value(hasItem(DEFAULT_OPERATION.toString())));
    }

    @Test
    @Transactional
    public void getDataSetOperation() throws Exception {
        // Initialize the database
        dataSetOperationRepository.saveAndFlush(dataSetOperation);

        // Get the dataSetOperation
        restDataSetOperationMockMvc.perform(get("/api/data-set-operations/{id}", dataSetOperation.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.id").value(dataSetOperation.getId().intValue()))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.operation").value(DEFAULT_OPERATION.toString()));
    }

    @Test
    @Transactional
    public void getNonExistingDataSetOperation() throws Exception {
        // Get the dataSetOperation
        restDataSetOperationMockMvc.perform(get("/api/data-set-operations/{id}", Long.MAX_VALUE))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateDataSetOperation() throws Exception {
        // Initialize the database
        dataSetOperationRepository.saveAndFlush(dataSetOperation);
        dataSetOperationSearchRepository.save(dataSetOperation);
        int databaseSizeBeforeUpdate = dataSetOperationRepository.findAll().size();

        // Update the dataSetOperation
        DataSetOperation updatedDataSetOperation = dataSetOperationRepository.findOne(dataSetOperation.getId());
        // Disconnect from session so that the updates on updatedDataSetOperation are not directly saved in db
        em.detach(updatedDataSetOperation);
        updatedDataSetOperation
            .createdAt(UPDATED_CREATED_AT)
            .operation(UPDATED_OPERATION);
        DataSetOperationDTO dataSetOperationDTO = dataSetOperationMapper.toDto(updatedDataSetOperation);

        restDataSetOperationMockMvc.perform(put("/api/data-set-operations")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetOperationDTO)))
            .andExpect(status().isOk());

        // Validate the DataSetOperation in the database
        List<DataSetOperation> dataSetOperationList = dataSetOperationRepository.findAll();
        assertThat(dataSetOperationList).hasSize(databaseSizeBeforeUpdate);
        DataSetOperation testDataSetOperation = dataSetOperationList.get(dataSetOperationList.size() - 1);
        assertThat(testDataSetOperation.getCreatedAt()).isEqualTo(UPDATED_CREATED_AT);
        assertThat(testDataSetOperation.getOperation()).isEqualTo(UPDATED_OPERATION);

        // Validate the DataSetOperation in Elasticsearch
        DataSetOperation dataSetOperationEs = dataSetOperationSearchRepository.findOne(testDataSetOperation.getId());
        assertThat(dataSetOperationEs).isEqualToComparingFieldByField(testDataSetOperation);
    }

    @Test
    @Transactional
    public void updateNonExistingDataSetOperation() throws Exception {
        int databaseSizeBeforeUpdate = dataSetOperationRepository.findAll().size();

        // Create the DataSetOperation
        DataSetOperationDTO dataSetOperationDTO = dataSetOperationMapper.toDto(dataSetOperation);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restDataSetOperationMockMvc.perform(put("/api/data-set-operations")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(dataSetOperationDTO)))
            .andExpect(status().isCreated());

        // Validate the DataSetOperation in the database
        List<DataSetOperation> dataSetOperationList = dataSetOperationRepository.findAll();
        assertThat(dataSetOperationList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteDataSetOperation() throws Exception {
        // Initialize the database
        dataSetOperationRepository.saveAndFlush(dataSetOperation);
        dataSetOperationSearchRepository.save(dataSetOperation);
        int databaseSizeBeforeDelete = dataSetOperationRepository.findAll().size();

        // Get the dataSetOperation
        restDataSetOperationMockMvc.perform(delete("/api/data-set-operations/{id}", dataSetOperation.getId())
            .accept(TestUtil.APPLICATION_JSON_UTF8))
            .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean dataSetOperationExistsInEs = dataSetOperationSearchRepository.exists(dataSetOperation.getId());
        assertThat(dataSetOperationExistsInEs).isFalse();

        // Validate the database is empty
        List<DataSetOperation> dataSetOperationList = dataSetOperationRepository.findAll();
        assertThat(dataSetOperationList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchDataSetOperation() throws Exception {
        // Initialize the database
        dataSetOperationRepository.saveAndFlush(dataSetOperation);
        dataSetOperationSearchRepository.save(dataSetOperation);

        // Search the dataSetOperation
        restDataSetOperationMockMvc.perform(get("/api/_search/data-set-operations?query=id:" + dataSetOperation.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(dataSetOperation.getId().intValue())))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].operation").value(hasItem(DEFAULT_OPERATION.toString())));
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSetOperation.class);
        DataSetOperation dataSetOperation1 = new DataSetOperation();
        dataSetOperation1.setId(1L);
        DataSetOperation dataSetOperation2 = new DataSetOperation();
        dataSetOperation2.setId(dataSetOperation1.getId());
        assertThat(dataSetOperation1).isEqualTo(dataSetOperation2);
        dataSetOperation2.setId(2L);
        assertThat(dataSetOperation1).isNotEqualTo(dataSetOperation2);
        dataSetOperation1.setId(null);
        assertThat(dataSetOperation1).isNotEqualTo(dataSetOperation2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(DataSetOperationDTO.class);
        DataSetOperationDTO dataSetOperationDTO1 = new DataSetOperationDTO();
        dataSetOperationDTO1.setId(1L);
        DataSetOperationDTO dataSetOperationDTO2 = new DataSetOperationDTO();
        assertThat(dataSetOperationDTO1).isNotEqualTo(dataSetOperationDTO2);
        dataSetOperationDTO2.setId(dataSetOperationDTO1.getId());
        assertThat(dataSetOperationDTO1).isEqualTo(dataSetOperationDTO2);
        dataSetOperationDTO2.setId(2L);
        assertThat(dataSetOperationDTO1).isNotEqualTo(dataSetOperationDTO2);
        dataSetOperationDTO1.setId(null);
        assertThat(dataSetOperationDTO1).isNotEqualTo(dataSetOperationDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(dataSetOperationMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(dataSetOperationMapper.fromId(null)).isNull();
    }
}
