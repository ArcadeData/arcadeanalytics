package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.ArcadeanalyticsApp;

import com.arcadeanalytics.domain.Contract;
import com.arcadeanalytics.repository.ContractRepository;
import com.arcadeanalytics.repository.search.ContractSearchRepository;
import com.arcadeanalytics.service.dto.ContractDTO;
import com.arcadeanalytics.service.mapper.ContractMapper;
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

import com.arcadeanalytics.domain.enumeration.ContractType;
/**
 * Test class for the ContractResource REST controller.
 *
 * @see ContractResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class ContractResourceIntTest {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIPTION = "BBBBBBBBBB";

    private static final ContractType DEFAULT_TYPE = ContractType.FREE;
    private static final ContractType UPDATED_TYPE = ContractType.SILVER;

    private static final Integer DEFAULT_MAX_WORKSPACES = 1;
    private static final Integer UPDATED_MAX_WORKSPACES = 2;

    private static final Integer DEFAULT_MAX_DASHBOARDS = 1;
    private static final Integer UPDATED_MAX_DASHBOARDS = 2;

    private static final Integer DEFAULT_MAX_WIDGETS = 1;
    private static final Integer UPDATED_MAX_WIDGETS = 2;

    private static final Integer DEFAULT_MAX_ELEMENTS = 1;
    private static final Integer UPDATED_MAX_ELEMENTS = 2;

    private static final Integer DEFAULT_MAX_TRAVERSAL = 1;
    private static final Integer UPDATED_MAX_TRAVERSAL = 2;

    private static final Integer DEFAULT_MAX_POWER = 1;
    private static final Integer UPDATED_MAX_POWER = 2;

    private static final Boolean DEFAULT_HA = false;
    private static final Boolean UPDATED_HA = true;

    private static final Integer DEFAULT_POLLING_INTERVAL = 1;
    private static final Integer UPDATED_POLLING_INTERVAL = 2;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private ContractMapper contractMapper;

    @Autowired
    private ContractSearchRepository contractSearchRepository;

    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private EntityManager em;

    private MockMvc restContractMockMvc;

    private Contract contract;

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final ContractResource contractResource = new ContractResource(contractRepository, contractMapper, contractSearchRepository);
        this.restContractMockMvc = MockMvcBuilders.standaloneSetup(contractResource)
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
    public static Contract createEntity(EntityManager em) {
        Contract contract = new Contract()
            .name(DEFAULT_NAME)
            .description(DEFAULT_DESCRIPTION)
            .type(DEFAULT_TYPE)
            .maxWorkspaces(DEFAULT_MAX_WORKSPACES)
            .maxDashboards(DEFAULT_MAX_DASHBOARDS)
            .maxWidgets(DEFAULT_MAX_WIDGETS)
            .maxElements(DEFAULT_MAX_ELEMENTS)
            .maxTraversal(DEFAULT_MAX_TRAVERSAL)
            .maxPower(DEFAULT_MAX_POWER)
            .ha(DEFAULT_HA)
            .pollingInterval(DEFAULT_POLLING_INTERVAL);
        return contract;
    }

    @Before
    public void initTest() {
        contractSearchRepository.deleteAll();
        contract = createEntity(em);
    }

    @Test
    @Transactional
    public void createContract() throws Exception {
        int databaseSizeBeforeCreate = contractRepository.findAll().size();

        // Create the Contract
        ContractDTO contractDTO = contractMapper.toDto(contract);
        restContractMockMvc.perform(post("/api/contracts")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(contractDTO)))
            .andExpect(status().isCreated());

        // Validate the Contract in the database
        List<Contract> contractList = contractRepository.findAll();
        assertThat(contractList).hasSize(databaseSizeBeforeCreate + 1);
        Contract testContract = contractList.get(contractList.size() - 1);
        assertThat(testContract.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testContract.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testContract.getType()).isEqualTo(DEFAULT_TYPE);
        assertThat(testContract.getMaxWorkspaces()).isEqualTo(DEFAULT_MAX_WORKSPACES);
        assertThat(testContract.getMaxDashboards()).isEqualTo(DEFAULT_MAX_DASHBOARDS);
        assertThat(testContract.getMaxWidgets()).isEqualTo(DEFAULT_MAX_WIDGETS);
        assertThat(testContract.getMaxElements()).isEqualTo(DEFAULT_MAX_ELEMENTS);
        assertThat(testContract.getMaxTraversal()).isEqualTo(DEFAULT_MAX_TRAVERSAL);
        assertThat(testContract.getMaxPower()).isEqualTo(DEFAULT_MAX_POWER);
        assertThat(testContract.isHa()).isEqualTo(DEFAULT_HA);
        assertThat(testContract.getPollingInterval()).isEqualTo(DEFAULT_POLLING_INTERVAL);

        // Validate the Contract in Elasticsearch
        Contract contractEs = contractSearchRepository.findOne(testContract.getId());
        assertThat(contractEs).isEqualToComparingFieldByField(testContract);
    }

    @Test
    @Transactional
    public void createContractWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = contractRepository.findAll().size();

        // Create the Contract with an existing ID
        contract.setId(1L);
        ContractDTO contractDTO = contractMapper.toDto(contract);

        // An entity with an existing ID cannot be created, so this API call must fail
        restContractMockMvc.perform(post("/api/contracts")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(contractDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Contract in the database
        List<Contract> contractList = contractRepository.findAll();
        assertThat(contractList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void checkNameIsRequired() throws Exception {
        int databaseSizeBeforeTest = contractRepository.findAll().size();
        // set the field null
        contract.setName(null);

        // Create the Contract, which fails.
        ContractDTO contractDTO = contractMapper.toDto(contract);

        restContractMockMvc.perform(post("/api/contracts")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(contractDTO)))
            .andExpect(status().isBadRequest());

        List<Contract> contractList = contractRepository.findAll();
        assertThat(contractList).hasSize(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    public void getAllContracts() throws Exception {
        // Initialize the database
        contractRepository.saveAndFlush(contract);

        // Get all the contractList
        restContractMockMvc.perform(get("/api/contracts?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(contract.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION.toString())))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].maxWorkspaces").value(hasItem(DEFAULT_MAX_WORKSPACES)))
            .andExpect(jsonPath("$.[*].maxDashboards").value(hasItem(DEFAULT_MAX_DASHBOARDS)))
            .andExpect(jsonPath("$.[*].maxWidgets").value(hasItem(DEFAULT_MAX_WIDGETS)))
            .andExpect(jsonPath("$.[*].maxElements").value(hasItem(DEFAULT_MAX_ELEMENTS)))
            .andExpect(jsonPath("$.[*].maxTraversal").value(hasItem(DEFAULT_MAX_TRAVERSAL)))
            .andExpect(jsonPath("$.[*].maxPower").value(hasItem(DEFAULT_MAX_POWER)))
            .andExpect(jsonPath("$.[*].ha").value(hasItem(DEFAULT_HA.booleanValue())))
            .andExpect(jsonPath("$.[*].pollingInterval").value(hasItem(DEFAULT_POLLING_INTERVAL)));
    }

    @Test
    @Transactional
    public void getContract() throws Exception {
        // Initialize the database
        contractRepository.saveAndFlush(contract);

        // Get the contract
        restContractMockMvc.perform(get("/api/contracts/{id}", contract.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.id").value(contract.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME.toString()))
            .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION.toString()))
            .andExpect(jsonPath("$.type").value(DEFAULT_TYPE.toString()))
            .andExpect(jsonPath("$.maxWorkspaces").value(DEFAULT_MAX_WORKSPACES))
            .andExpect(jsonPath("$.maxDashboards").value(DEFAULT_MAX_DASHBOARDS))
            .andExpect(jsonPath("$.maxWidgets").value(DEFAULT_MAX_WIDGETS))
            .andExpect(jsonPath("$.maxElements").value(DEFAULT_MAX_ELEMENTS))
            .andExpect(jsonPath("$.maxTraversal").value(DEFAULT_MAX_TRAVERSAL))
            .andExpect(jsonPath("$.maxPower").value(DEFAULT_MAX_POWER))
            .andExpect(jsonPath("$.ha").value(DEFAULT_HA.booleanValue()))
            .andExpect(jsonPath("$.pollingInterval").value(DEFAULT_POLLING_INTERVAL));
    }

    @Test
    @Transactional
    public void getNonExistingContract() throws Exception {
        // Get the contract
        restContractMockMvc.perform(get("/api/contracts/{id}", Long.MAX_VALUE))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateContract() throws Exception {
        // Initialize the database
        contractRepository.saveAndFlush(contract);
        contractSearchRepository.save(contract);
        int databaseSizeBeforeUpdate = contractRepository.findAll().size();

        // Update the contract
        Contract updatedContract = contractRepository.findOne(contract.getId());
        // Disconnect from session so that the updates on updatedContract are not directly saved in db
        em.detach(updatedContract);
        updatedContract
            .name(UPDATED_NAME)
            .description(UPDATED_DESCRIPTION)
            .type(UPDATED_TYPE)
            .maxWorkspaces(UPDATED_MAX_WORKSPACES)
            .maxDashboards(UPDATED_MAX_DASHBOARDS)
            .maxWidgets(UPDATED_MAX_WIDGETS)
            .maxElements(UPDATED_MAX_ELEMENTS)
            .maxTraversal(UPDATED_MAX_TRAVERSAL)
            .maxPower(UPDATED_MAX_POWER)
            .ha(UPDATED_HA)
            .pollingInterval(UPDATED_POLLING_INTERVAL);
        ContractDTO contractDTO = contractMapper.toDto(updatedContract);

        restContractMockMvc.perform(put("/api/contracts")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(contractDTO)))
            .andExpect(status().isOk());

        // Validate the Contract in the database
        List<Contract> contractList = contractRepository.findAll();
        assertThat(contractList).hasSize(databaseSizeBeforeUpdate);
        Contract testContract = contractList.get(contractList.size() - 1);
        assertThat(testContract.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testContract.getDescription()).isEqualTo(UPDATED_DESCRIPTION);
        assertThat(testContract.getType()).isEqualTo(UPDATED_TYPE);
        assertThat(testContract.getMaxWorkspaces()).isEqualTo(UPDATED_MAX_WORKSPACES);
        assertThat(testContract.getMaxDashboards()).isEqualTo(UPDATED_MAX_DASHBOARDS);
        assertThat(testContract.getMaxWidgets()).isEqualTo(UPDATED_MAX_WIDGETS);
        assertThat(testContract.getMaxElements()).isEqualTo(UPDATED_MAX_ELEMENTS);
        assertThat(testContract.getMaxTraversal()).isEqualTo(UPDATED_MAX_TRAVERSAL);
        assertThat(testContract.getMaxPower()).isEqualTo(UPDATED_MAX_POWER);
        assertThat(testContract.isHa()).isEqualTo(UPDATED_HA);
        assertThat(testContract.getPollingInterval()).isEqualTo(UPDATED_POLLING_INTERVAL);

        // Validate the Contract in Elasticsearch
        Contract contractEs = contractSearchRepository.findOne(testContract.getId());
        assertThat(contractEs).isEqualToComparingFieldByField(testContract);
    }

    @Test
    @Transactional
    public void updateNonExistingContract() throws Exception {
        int databaseSizeBeforeUpdate = contractRepository.findAll().size();

        // Create the Contract
        ContractDTO contractDTO = contractMapper.toDto(contract);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restContractMockMvc.perform(put("/api/contracts")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(contractDTO)))
            .andExpect(status().isCreated());

        // Validate the Contract in the database
        List<Contract> contractList = contractRepository.findAll();
        assertThat(contractList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteContract() throws Exception {
        // Initialize the database
        contractRepository.saveAndFlush(contract);
        contractSearchRepository.save(contract);
        int databaseSizeBeforeDelete = contractRepository.findAll().size();

        // Get the contract
        restContractMockMvc.perform(delete("/api/contracts/{id}", contract.getId())
            .accept(TestUtil.APPLICATION_JSON_UTF8))
            .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean contractExistsInEs = contractSearchRepository.exists(contract.getId());
        assertThat(contractExistsInEs).isFalse();

        // Validate the database is empty
        List<Contract> contractList = contractRepository.findAll();
        assertThat(contractList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchContract() throws Exception {
        // Initialize the database
        contractRepository.saveAndFlush(contract);
        contractSearchRepository.save(contract);

        // Search the contract
        restContractMockMvc.perform(get("/api/_search/contracts?query=id:" + contract.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(contract.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION.toString())))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].maxWorkspaces").value(hasItem(DEFAULT_MAX_WORKSPACES)))
            .andExpect(jsonPath("$.[*].maxDashboards").value(hasItem(DEFAULT_MAX_DASHBOARDS)))
            .andExpect(jsonPath("$.[*].maxWidgets").value(hasItem(DEFAULT_MAX_WIDGETS)))
            .andExpect(jsonPath("$.[*].maxElements").value(hasItem(DEFAULT_MAX_ELEMENTS)))
            .andExpect(jsonPath("$.[*].maxTraversal").value(hasItem(DEFAULT_MAX_TRAVERSAL)))
            .andExpect(jsonPath("$.[*].maxPower").value(hasItem(DEFAULT_MAX_POWER)))
            .andExpect(jsonPath("$.[*].ha").value(hasItem(DEFAULT_HA.booleanValue())))
            .andExpect(jsonPath("$.[*].pollingInterval").value(hasItem(DEFAULT_POLLING_INTERVAL)));
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Contract.class);
        Contract contract1 = new Contract();
        contract1.setId(1L);
        Contract contract2 = new Contract();
        contract2.setId(contract1.getId());
        assertThat(contract1).isEqualTo(contract2);
        contract2.setId(2L);
        assertThat(contract1).isNotEqualTo(contract2);
        contract1.setId(null);
        assertThat(contract1).isNotEqualTo(contract2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(ContractDTO.class);
        ContractDTO contractDTO1 = new ContractDTO();
        contractDTO1.setId(1L);
        ContractDTO contractDTO2 = new ContractDTO();
        assertThat(contractDTO1).isNotEqualTo(contractDTO2);
        contractDTO2.setId(contractDTO1.getId());
        assertThat(contractDTO1).isEqualTo(contractDTO2);
        contractDTO2.setId(2L);
        assertThat(contractDTO1).isNotEqualTo(contractDTO2);
        contractDTO1.setId(null);
        assertThat(contractDTO1).isNotEqualTo(contractDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(contractMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(contractMapper.fromId(null)).isNull();
    }
}
