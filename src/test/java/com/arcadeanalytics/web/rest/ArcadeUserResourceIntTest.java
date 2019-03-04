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
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.search.ArcadeUserSearchRepository;
import com.arcadeanalytics.service.dto.ArcadeUserDTO;
import com.arcadeanalytics.service.mapper.ArcadeUserMapper;
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
import java.util.List;

import static com.arcadeanalytics.web.rest.TestUtil.createFormattingConversionService;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for the ArcadeUserResource REST controller.
 *
 * @see ArcadeUserResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class ArcadeUserResourceIntTest {

    @Autowired
    private ArcadeUserRepository arcadeUserRepository;

    @Autowired
    private ArcadeUserMapper arcadeUserMapper;

    @Autowired
    private ArcadeUserSearchRepository arcadeUserSearchRepository;

    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private EntityManager em;

    private MockMvc restArcadeUserMockMvc;

    private ArcadeUser arcadeUser;

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final ArcadeUserResource arcadeUserResource = new ArcadeUserResource(arcadeUserRepository, arcadeUserMapper, arcadeUserSearchRepository);
        this.restArcadeUserMockMvc = MockMvcBuilders.standaloneSetup(arcadeUserResource)
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
    public static ArcadeUser createEntity(EntityManager em) {
        ArcadeUser arcadeUser = new ArcadeUser();
        return arcadeUser;
    }

    @Before
    public void initTest() {
        arcadeUserSearchRepository.deleteAll();
        arcadeUser = createEntity(em);
    }

    @Test
    @Transactional
    public void createArcadeUser() throws Exception {
        int databaseSizeBeforeCreate = arcadeUserRepository.findAll().size();

        // Create the ArcadeUser
        ArcadeUserDTO arcadeUserDTO = arcadeUserMapper.toDto(arcadeUser);
        restArcadeUserMockMvc.perform(post("/api/arcade-users")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(arcadeUserDTO)))
            .andExpect(status().isCreated());

        // Validate the ArcadeUser in the database
        List<ArcadeUser> arcadeUserList = arcadeUserRepository.findAll();
        assertThat(arcadeUserList).hasSize(databaseSizeBeforeCreate + 1);
        ArcadeUser testArcadeUser = arcadeUserList.get(arcadeUserList.size() - 1);

        // Validate the ArcadeUser in Elasticsearch
        ArcadeUser arcadeUserEs = arcadeUserSearchRepository.findOne(testArcadeUser.getId());
        assertThat(arcadeUserEs).isEqualToComparingFieldByField(testArcadeUser);
    }

    @Test
    @Transactional
    public void createArcadeUserWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = arcadeUserRepository.findAll().size();

        // Create the ArcadeUser with an existing ID
        arcadeUser.setId(1L);
        ArcadeUserDTO arcadeUserDTO = arcadeUserMapper.toDto(arcadeUser);

        // An entity with an existing ID cannot be created, so this API call must fail
        restArcadeUserMockMvc.perform(post("/api/arcade-users")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(arcadeUserDTO)))
            .andExpect(status().isBadRequest());

        // Validate the ArcadeUser in the database
        List<ArcadeUser> arcadeUserList = arcadeUserRepository.findAll();
        assertThat(arcadeUserList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void getAllArcadeUsers() throws Exception {
        // Initialize the database
        arcadeUserRepository.saveAndFlush(arcadeUser);

        // Get all the arcadeUserList
        restArcadeUserMockMvc.perform(get("/api/arcade-users?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(arcadeUser.getId().intValue())));
    }

    @Test
    @Transactional
    public void getArcadeUser() throws Exception {
        // Initialize the database
        arcadeUserRepository.saveAndFlush(arcadeUser);

        // Get the arcadeUser
        restArcadeUserMockMvc.perform(get("/api/arcade-users/{id}", arcadeUser.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.id").value(arcadeUser.getId().intValue()));
    }

    @Test
    @Transactional
    public void getNonExistingArcadeUser() throws Exception {
        // Get the arcadeUser
        restArcadeUserMockMvc.perform(get("/api/arcade-users/{id}", Long.MAX_VALUE))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateArcadeUser() throws Exception {
        // Initialize the database
        arcadeUserRepository.saveAndFlush(arcadeUser);
        arcadeUserSearchRepository.save(arcadeUser);
        int databaseSizeBeforeUpdate = arcadeUserRepository.findAll().size();

        // Update the arcadeUser
        ArcadeUser updatedArcadeUser = arcadeUserRepository.findOne(arcadeUser.getId());
        // Disconnect from session so that the updates on updatedArcadeUser are not directly saved in db
        em.detach(updatedArcadeUser);
        ArcadeUserDTO arcadeUserDTO = arcadeUserMapper.toDto(updatedArcadeUser);

        restArcadeUserMockMvc.perform(put("/api/arcade-users")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(arcadeUserDTO)))
            .andExpect(status().isOk());

        // Validate the ArcadeUser in the database
        List<ArcadeUser> arcadeUserList = arcadeUserRepository.findAll();
        assertThat(arcadeUserList).hasSize(databaseSizeBeforeUpdate);
        ArcadeUser testArcadeUser = arcadeUserList.get(arcadeUserList.size() - 1);

        // Validate the ArcadeUser in Elasticsearch
        ArcadeUser arcadeUserEs = arcadeUserSearchRepository.findOne(testArcadeUser.getId());
        assertThat(arcadeUserEs).isEqualToComparingFieldByField(testArcadeUser);
    }

    @Test
    @Transactional
    public void updateNonExistingArcadeUser() throws Exception {
        int databaseSizeBeforeUpdate = arcadeUserRepository.findAll().size();

        // Create the ArcadeUser
        ArcadeUserDTO arcadeUserDTO = arcadeUserMapper.toDto(arcadeUser);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restArcadeUserMockMvc.perform(put("/api/arcade-users")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(arcadeUserDTO)))
            .andExpect(status().isCreated());

        // Validate the ArcadeUser in the database
        List<ArcadeUser> arcadeUserList = arcadeUserRepository.findAll();
        assertThat(arcadeUserList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteArcadeUser() throws Exception {
        // Initialize the database
        arcadeUserRepository.saveAndFlush(arcadeUser);
        arcadeUserSearchRepository.save(arcadeUser);
        int databaseSizeBeforeDelete = arcadeUserRepository.findAll().size();

        // Get the arcadeUser
        restArcadeUserMockMvc.perform(delete("/api/arcade-users/{id}", arcadeUser.getId())
            .accept(TestUtil.APPLICATION_JSON_UTF8))
            .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean arcadeUserExistsInEs = arcadeUserSearchRepository.exists(arcadeUser.getId());
        assertThat(arcadeUserExistsInEs).isFalse();

        // Validate the database is empty
        List<ArcadeUser> arcadeUserList = arcadeUserRepository.findAll();
        assertThat(arcadeUserList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchArcadeUser() throws Exception {
        // Initialize the database
        arcadeUserRepository.saveAndFlush(arcadeUser);
        arcadeUserSearchRepository.save(arcadeUser);

        // Search the arcadeUser
        restArcadeUserMockMvc.perform(get("/api/_search/arcade-users?query=id:" + arcadeUser.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(arcadeUser.getId().intValue())));
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(ArcadeUser.class);
        ArcadeUser arcadeUser1 = new ArcadeUser();
        arcadeUser1.setId(1L);
        ArcadeUser arcadeUser2 = new ArcadeUser();
        arcadeUser2.setId(arcadeUser1.getId());
        assertThat(arcadeUser1).isEqualTo(arcadeUser2);
        arcadeUser2.setId(2L);
        assertThat(arcadeUser1).isNotEqualTo(arcadeUser2);
        arcadeUser1.setId(null);
        assertThat(arcadeUser1).isNotEqualTo(arcadeUser2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(ArcadeUserDTO.class);
        ArcadeUserDTO arcadeUserDTO1 = new ArcadeUserDTO();
        arcadeUserDTO1.setId(1L);
        ArcadeUserDTO arcadeUserDTO2 = new ArcadeUserDTO();
        assertThat(arcadeUserDTO1).isNotEqualTo(arcadeUserDTO2);
        arcadeUserDTO2.setId(arcadeUserDTO1.getId());
        assertThat(arcadeUserDTO1).isEqualTo(arcadeUserDTO2);
        arcadeUserDTO2.setId(2L);
        assertThat(arcadeUserDTO1).isNotEqualTo(arcadeUserDTO2);
        arcadeUserDTO1.setId(null);
        assertThat(arcadeUserDTO1).isNotEqualTo(arcadeUserDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(arcadeUserMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(arcadeUserMapper.fromId(null)).isNull();
    }
}
