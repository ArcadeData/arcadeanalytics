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

import com.arcadeanalytics.domain.WidgetSnapshot;
import com.arcadeanalytics.repository.WidgetSnapshotRepository;
import com.arcadeanalytics.repository.search.WidgetSnapshotSearchRepository;
import com.arcadeanalytics.service.dto.WidgetSnapshotDTO;
import com.arcadeanalytics.service.mapper.WidgetSnapshotMapper;
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
import org.springframework.util.Base64Utils;

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
 * Test class for the WidgetSnapshotResource REST controller.
 *
 * @see WidgetSnapshotResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class WidgetSnapshotResourceIntTest {

    private static final LocalDate DEFAULT_CREATED_AT = LocalDate.ofEpochDay(0L);
    private static final LocalDate UPDATED_CREATED_AT = LocalDate.now(ZoneId.systemDefault());

    private static final String DEFAULT_DATA = "AAAAAAAAAA";
    private static final String UPDATED_DATA = "BBBBBBBBBB";

    @Autowired
    private WidgetSnapshotRepository widgetSnapshotRepository;

    @Autowired
    private WidgetSnapshotMapper widgetSnapshotMapper;

    @Autowired
    private WidgetSnapshotSearchRepository widgetSnapshotSearchRepository;

    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private EntityManager em;

    private MockMvc restWidgetSnapshotMockMvc;

    private WidgetSnapshot widgetSnapshot;

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final WidgetSnapshotResource widgetSnapshotResource = new WidgetSnapshotResource(widgetSnapshotRepository, widgetSnapshotMapper, widgetSnapshotSearchRepository);
        this.restWidgetSnapshotMockMvc = MockMvcBuilders.standaloneSetup(widgetSnapshotResource)
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
    public static WidgetSnapshot createEntity(EntityManager em) {
        WidgetSnapshot widgetSnapshot = new WidgetSnapshot()
            .createdAt(DEFAULT_CREATED_AT)
            .data(DEFAULT_DATA);
        return widgetSnapshot;
    }

    @Before
    public void initTest() {
        widgetSnapshotSearchRepository.deleteAll();
        widgetSnapshot = createEntity(em);
    }

    @Test
    @Transactional
    public void createWidgetSnapshot() throws Exception {
        int databaseSizeBeforeCreate = widgetSnapshotRepository.findAll().size();

        // Create the WidgetSnapshot
        WidgetSnapshotDTO widgetSnapshotDTO = widgetSnapshotMapper.toDto(widgetSnapshot);
        restWidgetSnapshotMockMvc.perform(post("/api/widget-snapshots")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetSnapshotDTO)))
            .andExpect(status().isCreated());

        // Validate the WidgetSnapshot in the database
        List<WidgetSnapshot> widgetSnapshotList = widgetSnapshotRepository.findAll();
        assertThat(widgetSnapshotList).hasSize(databaseSizeBeforeCreate + 1);
        WidgetSnapshot testWidgetSnapshot = widgetSnapshotList.get(widgetSnapshotList.size() - 1);
        assertThat(testWidgetSnapshot.getCreatedAt()).isEqualTo(DEFAULT_CREATED_AT);
        assertThat(testWidgetSnapshot.getData()).isEqualTo(DEFAULT_DATA);

        // Validate the WidgetSnapshot in Elasticsearch
        WidgetSnapshot widgetSnapshotEs = widgetSnapshotSearchRepository.findOne(testWidgetSnapshot.getId());
        assertThat(widgetSnapshotEs).isEqualToComparingFieldByField(testWidgetSnapshot);
    }

    @Test
    @Transactional
    public void createWidgetSnapshotWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = widgetSnapshotRepository.findAll().size();

        // Create the WidgetSnapshot with an existing ID
        widgetSnapshot.setId(1L);
        WidgetSnapshotDTO widgetSnapshotDTO = widgetSnapshotMapper.toDto(widgetSnapshot);

        // An entity with an existing ID cannot be created, so this API call must fail
        restWidgetSnapshotMockMvc.perform(post("/api/widget-snapshots")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetSnapshotDTO)))
            .andExpect(status().isBadRequest());

        // Validate the WidgetSnapshot in the database
        List<WidgetSnapshot> widgetSnapshotList = widgetSnapshotRepository.findAll();
        assertThat(widgetSnapshotList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void getAllWidgetSnapshots() throws Exception {
        // Initialize the database
        widgetSnapshotRepository.saveAndFlush(widgetSnapshot);

        // Get all the widgetSnapshotList
        restWidgetSnapshotMockMvc.perform(get("/api/widget-snapshots?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(widgetSnapshot.getId().intValue())))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].data").value(hasItem(DEFAULT_DATA.toString())));
    }

    @Test
    @Transactional
    public void getWidgetSnapshot() throws Exception {
        // Initialize the database
        widgetSnapshotRepository.saveAndFlush(widgetSnapshot);

        // Get the widgetSnapshot
        restWidgetSnapshotMockMvc.perform(get("/api/widget-snapshots/{id}", widgetSnapshot.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.id").value(widgetSnapshot.getId().intValue()))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.data").value(DEFAULT_DATA.toString()));
    }

    @Test
    @Transactional
    public void getNonExistingWidgetSnapshot() throws Exception {
        // Get the widgetSnapshot
        restWidgetSnapshotMockMvc.perform(get("/api/widget-snapshots/{id}", Long.MAX_VALUE))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateWidgetSnapshot() throws Exception {
        // Initialize the database
        widgetSnapshotRepository.saveAndFlush(widgetSnapshot);
        widgetSnapshotSearchRepository.save(widgetSnapshot);
        int databaseSizeBeforeUpdate = widgetSnapshotRepository.findAll().size();

        // Update the widgetSnapshot
        WidgetSnapshot updatedWidgetSnapshot = widgetSnapshotRepository.findOne(widgetSnapshot.getId());
        // Disconnect from session so that the updates on updatedWidgetSnapshot are not directly saved in db
        em.detach(updatedWidgetSnapshot);
        updatedWidgetSnapshot
            .createdAt(UPDATED_CREATED_AT)
            .data(UPDATED_DATA);
        WidgetSnapshotDTO widgetSnapshotDTO = widgetSnapshotMapper.toDto(updatedWidgetSnapshot);

        restWidgetSnapshotMockMvc.perform(put("/api/widget-snapshots")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetSnapshotDTO)))
            .andExpect(status().isOk());

        // Validate the WidgetSnapshot in the database
        List<WidgetSnapshot> widgetSnapshotList = widgetSnapshotRepository.findAll();
        assertThat(widgetSnapshotList).hasSize(databaseSizeBeforeUpdate);
        WidgetSnapshot testWidgetSnapshot = widgetSnapshotList.get(widgetSnapshotList.size() - 1);
        assertThat(testWidgetSnapshot.getCreatedAt()).isEqualTo(UPDATED_CREATED_AT);
        assertThat(testWidgetSnapshot.getData()).isEqualTo(UPDATED_DATA);

        // Validate the WidgetSnapshot in Elasticsearch
        WidgetSnapshot widgetSnapshotEs = widgetSnapshotSearchRepository.findOne(testWidgetSnapshot.getId());
        assertThat(widgetSnapshotEs).isEqualToComparingFieldByField(testWidgetSnapshot);
    }

    @Test
    @Transactional
    public void updateNonExistingWidgetSnapshot() throws Exception {
        int databaseSizeBeforeUpdate = widgetSnapshotRepository.findAll().size();

        // Create the WidgetSnapshot
        WidgetSnapshotDTO widgetSnapshotDTO = widgetSnapshotMapper.toDto(widgetSnapshot);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restWidgetSnapshotMockMvc.perform(put("/api/widget-snapshots")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetSnapshotDTO)))
            .andExpect(status().isCreated());

        // Validate the WidgetSnapshot in the database
        List<WidgetSnapshot> widgetSnapshotList = widgetSnapshotRepository.findAll();
        assertThat(widgetSnapshotList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteWidgetSnapshot() throws Exception {
        // Initialize the database
        widgetSnapshotRepository.saveAndFlush(widgetSnapshot);
        widgetSnapshotSearchRepository.save(widgetSnapshot);
        int databaseSizeBeforeDelete = widgetSnapshotRepository.findAll().size();

        // Get the widgetSnapshot
        restWidgetSnapshotMockMvc.perform(delete("/api/widget-snapshots/{id}", widgetSnapshot.getId())
            .accept(TestUtil.APPLICATION_JSON_UTF8))
            .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean widgetSnapshotExistsInEs = widgetSnapshotSearchRepository.exists(widgetSnapshot.getId());
        assertThat(widgetSnapshotExistsInEs).isFalse();

        // Validate the database is empty
        List<WidgetSnapshot> widgetSnapshotList = widgetSnapshotRepository.findAll();
        assertThat(widgetSnapshotList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchWidgetSnapshot() throws Exception {
        // Initialize the database
        widgetSnapshotRepository.saveAndFlush(widgetSnapshot);
        widgetSnapshotSearchRepository.save(widgetSnapshot);

        // Search the widgetSnapshot
        restWidgetSnapshotMockMvc.perform(get("/api/_search/widget-snapshots?query=id:" + widgetSnapshot.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(widgetSnapshot.getId().intValue())))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].data").value(hasItem(DEFAULT_DATA.toString())));
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(WidgetSnapshot.class);
        WidgetSnapshot widgetSnapshot1 = new WidgetSnapshot();
        widgetSnapshot1.setId(1L);
        WidgetSnapshot widgetSnapshot2 = new WidgetSnapshot();
        widgetSnapshot2.setId(widgetSnapshot1.getId());
        assertThat(widgetSnapshot1).isEqualTo(widgetSnapshot2);
        widgetSnapshot2.setId(2L);
        assertThat(widgetSnapshot1).isNotEqualTo(widgetSnapshot2);
        widgetSnapshot1.setId(null);
        assertThat(widgetSnapshot1).isNotEqualTo(widgetSnapshot2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(WidgetSnapshotDTO.class);
        WidgetSnapshotDTO widgetSnapshotDTO1 = new WidgetSnapshotDTO();
        widgetSnapshotDTO1.setId(1L);
        WidgetSnapshotDTO widgetSnapshotDTO2 = new WidgetSnapshotDTO();
        assertThat(widgetSnapshotDTO1).isNotEqualTo(widgetSnapshotDTO2);
        widgetSnapshotDTO2.setId(widgetSnapshotDTO1.getId());
        assertThat(widgetSnapshotDTO1).isEqualTo(widgetSnapshotDTO2);
        widgetSnapshotDTO2.setId(2L);
        assertThat(widgetSnapshotDTO1).isNotEqualTo(widgetSnapshotDTO2);
        widgetSnapshotDTO1.setId(null);
        assertThat(widgetSnapshotDTO1).isNotEqualTo(widgetSnapshotDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(widgetSnapshotMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(widgetSnapshotMapper.fromId(null)).isNull();
    }
}
