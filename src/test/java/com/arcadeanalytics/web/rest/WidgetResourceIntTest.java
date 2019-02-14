package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.ArcadeanalyticsApp;
import com.arcadeanalytics.domain.ArcadeUser;
import com.arcadeanalytics.domain.Company;
import com.arcadeanalytics.domain.Contract;
import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.User;
import com.arcadeanalytics.domain.Widget;
import com.arcadeanalytics.domain.Workspace;
import com.arcadeanalytics.domain.enumeration.ContractType;
import com.arcadeanalytics.domain.enumeration.DataSourceType;
import com.arcadeanalytics.domain.enumeration.IndexingStatus;
import com.arcadeanalytics.provider.FileSystemDataProvider;
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.DataSetRepository;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.repository.FileSystemRepository;
import com.arcadeanalytics.repository.UserRepository;
import com.arcadeanalytics.repository.WidgetRepository;
import com.arcadeanalytics.repository.search.WidgetSearchRepository;
import com.arcadeanalytics.service.WidgetService;
import com.arcadeanalytics.service.dto.WidgetDTO;
import com.arcadeanalytics.service.mapper.WidgetMapper;
import com.arcadeanalytics.web.rest.errors.ExceptionTranslator;
import com.google.common.base.Charsets;
import org.assertj.core.api.Assertions;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import javax.persistence.EntityManager;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

import static com.arcadeanalytics.web.rest.TestUtil.createFormattingConversionService;
import static com.arcadeanalytics.web.rest.WorkspaceResourceIntTest.DEFAULT_DESCRIPTION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for the WidgetResource REST controller.
 *
 * @see WidgetResource
 */
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ArcadeanalyticsApp.class)
public class WidgetResourceIntTest {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_TYPE = "AAAAAAAAAA";
    private static final String UPDATED_TYPE = "BBBBBBBBBB";

    private static final Boolean DEFAULT_HAS_SNAPSHOT = false;
    private static final Boolean DEFAULT_IS_SHARED = false;
    private static final Boolean UPDATED_HAS_SNAPSHOT = true;

    @Autowired
    private WidgetRepository widgetRepository;
    @Autowired
    private DataSourceRepository dataSourceRepository;
    @Autowired
    private DataSetRepository dataSetRepository;

    @Autowired
    private WidgetMapper widgetMapper;

    @Autowired
    private WidgetService widgetService;

    @Autowired
    private WidgetSearchRepository widgetSearchRepository;

    @Autowired
    private MappingJackson2HttpMessageConverter jacksonMessageConverter;

    @Autowired
    private StringHttpMessageConverter stringHttpMessageConverter;

    @Autowired
    private PageableHandlerMethodArgumentResolver pageableArgumentResolver;

    @Autowired
    private ExceptionTranslator exceptionTranslator;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArcadeUserRepository arcadeUserRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private FileSystemRepository fsRepo;

    private MockMvc restWidgetMockMvc;

    private Widget widget;

    /**
     * Create an entity for this test.
     * <p>
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public Widget createEntity(EntityManager em) {


        final User user = userRepository.findOneByLogin("user").get();

        Contract contract = new Contract()
            .name("FREE")
            .type(ContractType.FREE)
            .maxWorkspaces(1)
            .maxTraversal(300)
            .maxElements(300)
            .maxDashboards(1)
            .maxWidgets(1);

        em.persist(contract);

        Company company = new Company()
            .name("company")
            .contract(contract);
        em.persist(company);

        final ArcadeUser arcadeUser = new ArcadeUser()
            .user(user)
            .company(company);
        em.persist(arcadeUser);

        Workspace workspace = new Workspace()
            .name(DEFAULT_NAME)
            .description(DEFAULT_DESCRIPTION)
            .user(arcadeUser);

        em.persist(workspace);

        Dashboard dashboard = new Dashboard()
            .name(DEFAULT_NAME)
            .description(DashboardResourceIntTest.DEFAULT_DESCRIPTION)
            .layout(DashboardResourceIntTest.DEFAULT_LAYOUT)
            .workspace(workspace);

        em.persist(dashboard);

        DataSource dataSource = new DataSource()
            .name(DEFAULT_NAME)
            .description(DEFAULT_DESCRIPTION)
            .type(DataSourceType.ORIENTDB)
            .indexing(IndexingStatus.INDEXING)
            .server("server")
            .port(1234)
            .database("database")
            .username("user")
            .password("password")
            .remote(false)
            .workspace(workspace);

        em.persist(dataSource);


        Widget widget = new Widget()
            .name(DEFAULT_NAME)
            .type(DEFAULT_TYPE)
            .hasSnapshot(DEFAULT_HAS_SNAPSHOT)
            .shared(DEFAULT_IS_SHARED)
            .dashboard(dashboard)
            .dataSource(dataSource);


        return widget;
    }

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final WidgetResource widgetResource = new WidgetResource(widgetService);
        this.restWidgetMockMvc = MockMvcBuilders.standaloneSetup(widgetResource)
            .setCustomArgumentResolvers(pageableArgumentResolver)
            .setControllerAdvice(exceptionTranslator)
            .setConversionService(createFormattingConversionService())
            .setMessageConverters(jacksonMessageConverter, stringHttpMessageConverter)
            .build();
    }

    @Before
    public void initTest() {
        widgetSearchRepository.deleteAll();
        widget = createEntity(em);
    }

    @Test
    @Transactional
    @WithMockUser
    public void createWidget() throws Exception {
        int databaseSizeBeforeCreate = widgetRepository.findAll().size();


        // Create the Widget
        WidgetDTO widgetDTO = widgetMapper.toDto(widget);
        restWidgetMockMvc.perform(post("/api/widgets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetDTO)))
            .andExpect(status().isCreated());

        // Validate the Widget in the database
        List<Widget> widgetList = widgetRepository.findAll();
        assertThat(widgetList).hasSize(databaseSizeBeforeCreate + 1);
        Widget testWidget = widgetList.get(widgetList.size() - 1);
        assertThat(testWidget.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testWidget.getType()).isEqualTo(DEFAULT_TYPE);
        assertThat(testWidget.isHasSnapshot()).isEqualTo(DEFAULT_HAS_SNAPSHOT);
        assertThat(testWidget.isShared()).isEqualTo(DEFAULT_IS_SHARED);
        assertThat(testWidget.getUuid()).isNotNull();

        // Validate the Widget in Elasticsearch
        Widget widgetEs = widgetSearchRepository.findOne(testWidget.getId());
        assertThat(widgetEs).isEqualToComparingFieldByField(testWidget);
    }

    @Test
    @Transactional
    @WithMockUser
    public void createTooMuchWidget() throws Exception {
        int databaseSizeBeforeCreate = widgetRepository.findAll().size();


        // Create the Widget
        WidgetDTO widgetDTO = widgetMapper.toDto(widget);
        restWidgetMockMvc.perform(post("/api/widgets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetDTO)))
            .andExpect(status().isCreated());

        // max one widget is allowed
        widgetDTO = widgetMapper.toDto(widget);
        restWidgetMockMvc.perform(post("/api/widgets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetDTO)))
            .andExpect(status().isInternalServerError());

    }

    @Test
    @Transactional
    public void createWidgetWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = widgetRepository.findAll().size();

        // Create the Widget with an existing ID
        widget.setId(1L);
        WidgetDTO widgetDTO = widgetMapper.toDto(widget);

        // An entity with an existing ID cannot be created, so this API call must fail
        restWidgetMockMvc.perform(post("/api/widgets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Widget in the database
        List<Widget> widgetList = widgetRepository.findAll();
        assertThat(widgetList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    public void checkNameIsRequired() throws Exception {
        int databaseSizeBeforeTest = widgetRepository.findAll().size();
        // set the field null
        widget.setName(null);

        // Create the Widget, which fails.
        WidgetDTO widgetDTO = widgetMapper.toDto(widget);

        restWidgetMockMvc.perform(post("/api/widgets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetDTO)))
            .andExpect(status().isBadRequest());

        List<Widget> widgetList = widgetRepository.findAll();
        assertThat(widgetList).hasSize(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
//    @WithMockUser
    public void getAllWidgets() throws Exception {
        widgetRepository.saveAndFlush(widget);

        restWidgetMockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        // Get all the widgetList
        restWidgetMockMvc.perform(get("/api/widgets?sort=id,desc")
            .with(user("admin").roles("ADMIN")))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(widget.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].hasSnapshot").value(hasItem(DEFAULT_HAS_SNAPSHOT.booleanValue())));
    }

    @Test
    @Transactional
    @WithMockUser
    public void getWidget() throws Exception {
        // Initialize the database
        widgetRepository.saveAndFlush(widget);

        // Get the widget
        restWidgetMockMvc.perform(get("/api/widgets/{id}", widget.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.id").value(widget.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME.toString()))
            .andExpect(jsonPath("$.type").value(DEFAULT_TYPE.toString()))
            .andExpect(jsonPath("$.dashboardId").isNotEmpty())
            .andExpect(jsonPath("$.dataSourceId").isNotEmpty())
            .andExpect(jsonPath("$.hasSnapshot").value(DEFAULT_HAS_SNAPSHOT.booleanValue()));
    }


    @Test
    @Transactional
    @WithMockUser
    public void getNonExistingWidget() throws Exception {
        // Get the widget
        restWidgetMockMvc.perform(get("/api/widgets/{id}", Long.MAX_VALUE))
            .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    public void updateWidget() throws Exception {
        // Initialize the database
        widgetRepository.saveAndFlush(widget);
        widgetSearchRepository.save(widget);
        int databaseSizeBeforeUpdate = widgetRepository.findAll().size();

        // Update the widget
        Widget updatedWidget = widgetRepository.findOne(widget.getId());
        // Disconnect from session so that the updates on updatedWidget are not directly saved in db
        em.detach(updatedWidget);
        updatedWidget
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .hasSnapshot(UPDATED_HAS_SNAPSHOT);

        WidgetDTO widgetDTO = widgetMapper.toDto(updatedWidget);

        restWidgetMockMvc.perform(put("/api/widgets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetDTO)))
            .andExpect(status().isOk());

        // Validate the Widget in the database
        List<Widget> widgetList = widgetRepository.findAll();
        assertThat(widgetList).hasSize(databaseSizeBeforeUpdate);
        Widget testWidget = widgetList.get(widgetList.size() - 1);
        assertThat(testWidget.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testWidget.getType()).isEqualTo(UPDATED_TYPE);
        assertThat(testWidget.isHasSnapshot()).isEqualTo(UPDATED_HAS_SNAPSHOT);

        // Validate the Widget in Elasticsearch
        Widget widgetEs = widgetSearchRepository.findOne(testWidget.getId());
        assertThat(widgetEs).isEqualToComparingFieldByField(testWidget);
    }


    @Test
    @Transactional
    @WithMockUser
    public void shouldPutSnapshotWidgetData() throws Exception {
        // Initialize the database
        widgetRepository.saveAndFlush(widget);
        widgetSearchRepository.save(widget);

        final String json = new String(Files.readAllBytes(Paths.get("./src/test/resources/snapshots/data-snapshot.json")), Charsets.UTF_8);

        restWidgetMockMvc.perform(put("/api/widgets/snapshot/" + widget.getId())
            .contentType(MediaType.TEXT_PLAIN_VALUE)
            .content(json))
            .andExpect(status().isNoContent());


        final FileSystemDataProvider provider = new FileSystemDataProvider(fsRepo);

        final Optional<String> s = provider.fetchData(widget);
        Assertions.assertThat(s)
            .isPresent()
            .contains(json);
    }


    @Test
    @Transactional
    @WithMockUser
    public void shouldGetSnapshotWidgetData() throws Exception {

        // Initialize the database
        widgetRepository.saveAndFlush(widget);
        widgetSearchRepository.save(widget);

        final String json = "{'widget': 'data'}";

        restWidgetMockMvc.perform(put("/api/widgets/snapshot/{id}", widget.getId())
            .contentType(MediaType.TEXT_PLAIN_VALUE)
            .content(json))
            .andExpect(status().isNoContent());

        restWidgetMockMvc.perform(get("/api/widgets/snapshot/{id}", widget.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
//            .andExpect(content().string(json))
        ;
    }

    @Test
    @Transactional
    @WithMockUser
    public void updateNonExistingWidget() throws Exception {
        int databaseSizeBeforeUpdate = widgetRepository.findAll().size();

        final User user = userRepository.findOneByLogin("user").get();
        final ArcadeUser arcadeUser = arcadeUserRepository.findByUser(user).get();

        Contract contract = new Contract();
        contract.maxElements(300)
            .name("FREE")
            .description("free")
            .type(ContractType.FREE)
            .maxWidgets(100);
        em.persist(contract);

        Company company = new Company();
        company.name("testCompany");
        company.contract(contract);
        em.persist(company);

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
            .type(DataSourceType.ORIENTDB)
            .indexing(IndexingStatus.INDEXING)
            .server("server")
            .port(1234)
            .database("database")
            .username("user")
            .password("password")
            .remote(false)
            .workspace(workspace);
        em.persist(dataSource);

        // Create the Widget
        WidgetDTO widgetDTO = widgetMapper.toDto(widget);

        // If the entity doesn't have an ID, it will be created instead of just being updated
        restWidgetMockMvc.perform(put("/api/widgets")
            .contentType(TestUtil.APPLICATION_JSON_UTF8)
            .content(TestUtil.convertObjectToJsonBytes(widgetDTO)))
            .andExpect(status().isCreated());

        // Validate the Widget in the database
        List<Widget> widgetList = widgetRepository.findAll();
        assertThat(widgetList).hasSize(databaseSizeBeforeUpdate + 1);
    }

    @Test
    @Transactional
    public void deleteWidget() throws Exception {
        // Initialize the database
        widgetRepository.saveAndFlush(widget);
        widgetSearchRepository.save(widget);
        int databaseSizeBeforeDelete = widgetRepository.findAll().size();

        // Get the widget
        restWidgetMockMvc.perform(delete("/api/widgets/{id}", widget.getId())
            .accept(TestUtil.APPLICATION_JSON_UTF8))
            .andExpect(status().isOk());

        // Validate Elasticsearch is empty
        boolean widgetExistsInEs = widgetSearchRepository.exists(widget.getId());
        assertThat(widgetExistsInEs).isFalse();

        // Validate the database is empty
        List<Widget> widgetList = widgetRepository.findAll();
        assertThat(widgetList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    public void searchWidget() throws Exception {
        // Initialize the database
        widgetRepository.saveAndFlush(widget);
        widgetSearchRepository.save(widget);

        // Search the widget
        restWidgetMockMvc.perform(get("/api/_search/widgets?query=id:" + widget.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(widget.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME.toString())))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].hasSnapshot").value(hasItem(DEFAULT_HAS_SNAPSHOT.booleanValue())))
        ;
    }

    @Test
    @Transactional
    public void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Widget.class);
        Widget widget1 = new Widget();
        widget1.setId(1L);
        Widget widget2 = new Widget();
        widget2.setId(widget1.getId());
        assertThat(widget1).isEqualTo(widget2);
        widget2.setId(2L);
        assertThat(widget1).isNotEqualTo(widget2);
        widget1.setId(null);
        assertThat(widget1).isNotEqualTo(widget2);
    }

    @Test
    @Transactional
    public void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(WidgetDTO.class);
        WidgetDTO widgetDTO1 = new WidgetDTO();
        widgetDTO1.setId(1L);
        WidgetDTO widgetDTO2 = new WidgetDTO();
        assertThat(widgetDTO1).isNotEqualTo(widgetDTO2);
        widgetDTO2.setId(widgetDTO1.getId());
        assertThat(widgetDTO1).isEqualTo(widgetDTO2);
        widgetDTO2.setId(2L);
        assertThat(widgetDTO1).isNotEqualTo(widgetDTO2);
        widgetDTO1.setId(null);
        assertThat(widgetDTO1).isNotEqualTo(widgetDTO2);
    }

    @Test
    @Transactional
    public void testEntityFromId() {
        assertThat(widgetMapper.fromId(42L).getId()).isEqualTo(42);
        assertThat(widgetMapper.fromId(null)).isNull();
    }
}
