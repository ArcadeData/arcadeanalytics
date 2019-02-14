package com.arcadeanalytics.service;

import com.arcadeanalytics.domain.Contract;
import com.arcadeanalytics.domain.DataSet;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.Widget;
import com.arcadeanalytics.provider.CytoData;
import com.arcadeanalytics.provider.DataSourceGraphDataProvider;
import com.arcadeanalytics.provider.DataSourceGraphDataProviderFactory;
import com.arcadeanalytics.provider.DataSourceGraphProviderFactory;
import com.arcadeanalytics.provider.DataSourceInfo;
import com.arcadeanalytics.provider.DataSourceMetadataProviderFactory;
import com.arcadeanalytics.provider.FileSystemDataProvider;
import com.arcadeanalytics.provider.GraphData;
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.DataSetRepository;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.repository.FileSystemRepository;
import com.arcadeanalytics.repository.WidgetRepository;
import com.arcadeanalytics.repository.search.WidgetSearchRepository;
import com.arcadeanalytics.security.AuthoritiesConstants;
import com.arcadeanalytics.security.SecurityUtils;
import com.arcadeanalytics.service.dto.LoadElementsFromClassesDTO;
import com.arcadeanalytics.service.dto.QueryDTO;
import com.arcadeanalytics.service.dto.SearchQueryDTO;
import com.arcadeanalytics.service.dto.TraverseDTO;
import com.arcadeanalytics.service.dto.WidgetDTO;
import com.arcadeanalytics.service.mapper.WidgetMapper;
import com.arcadeanalytics.web.algorithms.AlgorithmsUtils;
import com.arcadeanalytics.web.algorithms.ShortestPathInput;
import com.arcadeanalytics.web.algorithms.ShortestPathResult;
import com.arcadeanalytics.web.layout.LayoutUtils;
import com.arcadeanalytics.web.rest.errors.InternalServerErrorException;
import edu.uci.ics.jung.algorithms.layout.AbstractLayout;
import edu.uci.ics.jung.algorithms.layout.CircleLayout;
import edu.uci.ics.jung.graph.DirectedSparseGraph;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.arcadeanalytics.service.util.DataSourceUtil.toDataSourceInfo;
import static org.elasticsearch.index.query.QueryBuilders.queryStringQuery;

/**
 * Service Interface for managing Widget.
 */
@Service
@Transactional
public class WidgetService {

    public static final String SNAPSHOT_PREFIX = "data-snapshot-";

    private final Logger log = LoggerFactory.getLogger(WidgetService.class);

    private final WidgetRepository widgetRepository;

    private final DataSetRepository dataSetRepository;

    private final DataSourceRepository dataSourceRepository;

    private final WidgetMapper widgetMapper;

    private final WidgetSearchRepository widgetSearchRepository;

    private final ArcadeUserRepository arcadeUserRepository;

    private final FileSystemRepository fsRepository;

    private final CacheManager cacheManager;

    private final DataSourceMetadataProviderFactory dataSourceMetadataProviderFactory;

    private final DataSourceGraphDataProviderFactory dataSourceGraphDataProviderFactory;

    private final DataSourceGraphProviderFactory dataSourceGraphProviderFactory;

    public WidgetService(WidgetRepository widgetRepository,
                         WidgetMapper widgetMapper,
                         WidgetSearchRepository widgetSearchRepository,
                         DataSetRepository dataSetRepository,
                         DataSourceRepository dataSourceRepository,
                         ArcadeUserRepository arcadeUserRepository,
                         FileSystemRepository fsRepository,
                         CacheManager cacheManager,
                         DataSourceMetadataProviderFactory dataSourceMetadataProviderFactory,
                         DataSourceGraphDataProviderFactory dataSourceGraphDataProviderFactory,
                         DataSourceGraphProviderFactory dataSourceGraphProviderFactory) {
        this.widgetRepository = widgetRepository;
        this.widgetMapper = widgetMapper;
        this.widgetSearchRepository = widgetSearchRepository;
        this.dataSetRepository = dataSetRepository;
        this.dataSourceRepository = dataSourceRepository;
        this.arcadeUserRepository = arcadeUserRepository;
        this.fsRepository = fsRepository;
        this.cacheManager = cacheManager;

        this.dataSourceMetadataProviderFactory = dataSourceMetadataProviderFactory;
        this.dataSourceGraphDataProviderFactory = dataSourceGraphDataProviderFactory;
        this.dataSourceGraphProviderFactory = dataSourceGraphProviderFactory;
    }


    /**
     * Save a widget.
     *
     * @param widgetDTO the entity to save
     * @return the persisted entity
     */
    public WidgetDTO save(WidgetDTO widgetDTO, Long dataSourceId) {
        log.debug("Request to save Widget : {}", widgetDTO);

        final List<Widget> widgets = widgetRepository.findByDashboardWorkspaceUserUserLogin(SecurityUtils.getCurrentUserLogin().get());

        int maxWidgets = arcadeUserRepository.findByUserLogin(SecurityUtils.getCurrentUserLogin().get())
                .get().getCompany().getContract().getMaxWidgets();

        if (widgets.size() == maxWidgets) {
            throw new InternalServerErrorException("No more widgets can be created, max number is: " + maxWidgets);
        }


        log.info("saving::: {}  ", widgetDTO);
        Widget widget = widgetMapper.toEntity(widgetDTO);

        if (widget.getType().equalsIgnoreCase("text-editor")) {
            DataSet dataSet = new DataSet()
                    .widget(widget)
                    .name(widget.getName());

            dataSetRepository.save(dataSet);

        } else {
            DataSource dataSource;
            if (dataSourceId != -1L)
                dataSource = dataSourceRepository.findOne(dataSourceId);
            else
                dataSource = dataSourceRepository.findByWorkspaceUserUserLogin(SecurityUtils.getCurrentUserLogin().get()).get(0);


            DataSet dataSet = new DataSet()
                    .widget(widget)
                    .name(dataSource.getName());

            dataSetRepository.save(dataSet);
        }

        widget = widgetRepository.save(widget);
        WidgetDTO result = widgetMapper.toDto(widget);
        widgetSearchRepository.save(widget);
        return result;
    }

    /**
     * Save a widget.
     *
     * @param widgetDTO the entity to save
     * @return the persisted entity
     */
    public WidgetDTO save(WidgetDTO widgetDTO) {
        log.debug("Request to save Widget : {}", widgetDTO);

        Widget widget = widgetMapper.toEntity(widgetDTO);
        widget = widgetRepository.save(widget);
        WidgetDTO result = widgetMapper.toDto(widget);
        widgetSearchRepository.save(widget);
        return result;
    }

    /**
     * Get all the widgets.
     *
     * @param pageable the pagination information
     * @return the list of entities
     */
    @Transactional(readOnly = true)
    public Page<WidgetDTO> findAll(Pageable pageable) {
        log.debug("Request to get all Widgets");

        Page<Widget> page;
        if (SecurityUtils.isCurrentUserInRole(AuthoritiesConstants.ADMIN)) {
            page = widgetRepository.findAll(pageable);
        } else {
            page = widgetRepository.findByDashboardWorkspaceUserUserLogin(SecurityUtils.getCurrentUserLogin().get(), pageable);
        }

        return page.map(widgetMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<WidgetDTO> findAllByDashboard(Long dashboardId, Pageable pageable) {
        log.debug("Request to get all Widgets");

        Page<Widget> page = widgetRepository.findByDashboardId(dashboardId, pageable);

        return page.map(widgetMapper::toDto);

    }

    /**
     * Get one widget by id.
     *
     * @param id the id of the entity
     * @return the entity
     */
    @Transactional(readOnly = true)
    public WidgetDTO findOne(Long id) {
        log.debug("Request to get Widget : {}", id);

        return getWidgetIfAllowed(id)
                .map(w -> widgetMapper.toDto(w))
                .orElse(null);
    }

    /**
     * Delete the  widget by id.
     *
     * @param id the id of the entity
     */
    public void delete(Long id) {
        log.debug("Request to delete Widget : {}", id);
        widgetRepository.delete(id);
        widgetSearchRepository.delete(id);
    }

    /**
     * Search for the widget corresponding to the query.
     *
     * @param query    the query of the search
     * @param pageable the pagination information
     * @return the list of entities
     */
    @Transactional(readOnly = true)
    public Page<WidgetDTO> search(String query, Pageable pageable) {
        log.debug("Request to search for a page of Widgets for query {}", query);
        Page<Widget> result = widgetSearchRepository.search(queryStringQuery(query), pageable);
        return result.map(widgetMapper::toDto);
    }

    @Transactional(readOnly = true)
    public GraphData getData(Long id, QueryDTO query) {
        return getWidgetIfAllowed(id)
                .map(widget -> {

                            final Contract contract = contract();

                            if (query.getDatasetCardinality() > contract.getMaxElements()) return GraphData.getEMPTY();


                            final DataSourceInfo ds = toDataSourceInfo(widget.getDataSource());

                            final int limit = contract.getMaxElements() - query.getDatasetCardinality();

                            final GraphData graphData = dataSourceGraphDataProviderFactory.create(ds)
                                    .fetchData(ds, query.getQuery(), limit);
                            return graphData;

                        }

                )
                .orElse(GraphData.getEMPTY());


    }

    /**
     * Returns the latest snapshot
     *
     * @param id
     * @return
     */
    public Optional<String> getSnapshot(Long id) {

        return getWidgetIfAllowed(id)
                .map(widget -> new FileSystemDataProvider(fsRepository)
                        .fetchData(widget)
                        .map(name -> name.replace(SNAPSHOT_PREFIX, "")))
                .orElse(Optional.empty());
    }

    /**
     * Returns the latest snapshot
     *
     * @param uuid
     * @return
     */
    public Optional<String> getSnapshotForEmbed(UUID uuid) {

        return widgetRepository.findOneByUuid(uuid)
                .filter(widget -> widget.isShared())
                .map(widget -> new FileSystemDataProvider(fsRepository)
                        .fetchData(widget)
                        .map(name -> name.replace(SNAPSHOT_PREFIX, "")))
                .orElse(Optional.empty());
    }


    /**
     * Returns the snapshot with the given filename, or the last id the given file name is "last"
     *
     * @param id
     * @param fileName
     * @return
     */
    public Optional<String> getSnapshot(Long id, String fileName) {

        if (fileName.equalsIgnoreCase("last")) return getSnapshot(id);

        return getWidgetIfAllowed(id)
                .map(widget -> new FileSystemDataProvider(fsRepository)
                        .fetchData(widget, SNAPSHOT_PREFIX + fileName)
                        .map(name -> name.replace(SNAPSHOT_PREFIX, "")))
                .orElse(Optional.empty());
    }


    public List<String> getSnapshots(Long id) {
        return getWidgetIfAllowed(id)
                .map(widget -> new FileSystemDataProvider(fsRepository)
                        .getAllSnapshots(widget).stream()
                        .map(name -> name.replace(SNAPSHOT_PREFIX, ""))
                        .collect(Collectors.toList()))

                .orElse(Collections.emptyList());

    }


    @Transactional
    public boolean saveSnapshot(Long id, String snapshotData) {

        return getWidgetIfAllowed(id)
                .map(widget -> {
                    final String file = "widgets/"
                            + widget.getId().toString()
                            + "/"
                            + SNAPSHOT_PREFIX
                            + DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(LocalDateTime.now());

                    final boolean stored = fsRepository.store(file, snapshotData.getBytes());

                    widgetRepository.save(widget.hasSnapshot(stored));
                    return stored;
                }).orElse(false);

    }

    public String layout(final String layoutType, final String json) {

        return new LayoutUtils().applyLayout(layoutType, json);
    }

    public ShortestPathResult performAlgorithm(final String algorithmName, final ShortestPathInput jsonInput) {
        return new AlgorithmsUtils().performAlgorithm(algorithmName, jsonInput);
    }

    public String layoutWithService(final String layoutType, final String json) {

        final LayoutService layoutService = new LayoutService();

        AbstractLayout layout = layoutService.applyLayout(layoutType, json);

        return layoutService.toJson(layout);
    }


    public GraphData traverse(Long id, TraverseDTO traverse) {


        return getWidgetIfAllowed(id)
                .map(widget -> {
                    final Contract contract = contract();

                    if (traverse.getDatasetCardinality() > contract.getMaxElements()) return GraphData.getEMPTY();

                    final DataSource dataSource = widget.getDataSource();

                    final DataSourceInfo dsInfo = toDataSourceInfo(dataSource);

                    final int limit = Math.min(
                            contract.getMaxElements() - traverse.getDatasetCardinality(),
                            contract.getMaxTraversal());

                    GraphData result = dataSourceGraphDataProviderFactory
                            .create(dsInfo)
                            .expand(dsInfo, traverse.getNodeIds(), traverse.getDirection(), traverse.getEdgeClass(), limit);

                    applyLayout(result);

                    return result;

                }).orElse(GraphData.getEMPTY());
    }

    public GraphData load(Long id, SearchQueryDTO query) {

        return getWidgetIfAllowed(id)
                .map(widget -> {
                            final Contract contract = contract();

                            if (query.getIds().length > contract.getMaxElements()) return GraphData.getEMPTY();

                            final DataSource dataSource = widget.getDataSource();

                            final DataSourceInfo dsInfo = toDataSourceInfo(dataSource);

                            GraphData result = dataSourceGraphDataProviderFactory.create(dsInfo)
                                    .load(dsInfo, query.getIds());

                            applyLayout(result);

                            return result;

                        }
                ).orElse(GraphData.getEMPTY());

    }

    public GraphData loadElementsFromClasses(Long id, LoadElementsFromClassesDTO query) {

        return getWidgetIfAllowed(id)
                .map(widget -> {

                            final Contract contract = contract();

                            if (query.getDatasetCardinality() > contract.getMaxElements()) return GraphData.getEMPTY();

                            final DataSource dataSource = widget.getDataSource();

                            final DataSourceInfo dsInfo = toDataSourceInfo(dataSource);

                            DataSourceGraphDataProvider provider = dataSourceGraphDataProviderFactory.create(dsInfo);

                            final int limit = Math.min(
                                    contract.getMaxElements() - query.getDatasetCardinality(),
                                    query.getLimit());

                            GraphData result = loadFromClasses(query.getClassesNames(), dsInfo, provider, contract.getMaxElements(), limit);

                            applyLayout(result);

                            return result;

                        }
                ).orElse(GraphData.getEMPTY());

    }


    @NotNull
    private GraphData loadFromClasses(String[] classesNames, DataSourceInfo dsInfo, DataSourceGraphDataProvider provider, int maxElements, int limit) {
        //TODO move into provider
        // merge all graph data in a single graph data object
        Map<String, Map<String, Object>> nodeClasses = new LinkedHashMap<>();
        Map<String, Map<String, Object>> edgeClasses = new LinkedHashMap<>();
        Set<CytoData> nodes = new LinkedHashSet<>();
        Set<CytoData> edges = new LinkedHashSet<>();

        boolean truncated = false;
        for (String className : classesNames) {
            GraphData result = provider.loadFromClass(dsInfo, className, limit);

            nodeClasses.putAll(result.getNodesClasses());
            edgeClasses.putAll(result.getEdgesClasses());
            nodes.addAll(result.getNodes());
            edges.addAll(result.getEdges());
            if (result.getTruncated()) truncated = true;
        }

        return new GraphData(nodeClasses, edgeClasses, nodes, edges, truncated);
    }

    private void applyLayout(GraphData result) {
        final DirectedSparseGraph g = new DirectedSparseGraph();

        final CircleLayout layout = new CircleLayout(g);
        layout.setRadius(400);

        new LayoutUtils().layout(layout, g, result, 800, 800);
    }


    /**
     * Utility method that verifies if the requested widget is visible to the current user
     *
     * @param id
     * @return
     */
    private Optional<Widget> getWidgetIfAllowed(Long id) {

        Widget widget = widgetRepository.findOne(id);

        final Boolean isAllowed = Optional.ofNullable(widget)
                .map(w -> w.getDashboard().getWorkspace().getUser().getUser().getLogin())
                .map(o -> SecurityUtils.isAllowed(o))
                .orElse(false);

        if (isAllowed) return Optional.of(widget);
        log.warn("user {} is not allowed to play wit widget {} ", SecurityUtils.getCurrentUserLogin(), id);

        return Optional.empty();


    }

    private Optional<Widget> getWidgetIfAllowed(Long id, Long userId) {

        Widget widget = widgetRepository.findOne(id);

        final Boolean isAllowed = Optional.ofNullable(widget)
                .map(w -> w.getDashboard().getWorkspace().getUser().getUser().getId())
                .map(i -> i == userId)
                .orElse(false);

        if (isAllowed) return Optional.of(widget);
        log.warn("user {} is not allowed to play wit widget {} ", SecurityUtils.getCurrentUserLogin(), id);

        return Optional.empty();

    }


    private Contract contractOld(Widget widget) {

        final Contract contract = widget.getDashboard().getWorkspace().getUser().getCompany().getContract();

        log.info("contrat:: {}  ", contract);
        return contract;


    }

    private Contract contract() {

        final Contract contract = SecurityUtils.getCurrentUserLogin()
                .flatMap(user -> arcadeUserRepository.findByUserLogin(user))
                .map(arcadeUser -> arcadeUser.getCompany().getContract()).get();

        log.info("contrat:: {}  ", contract);
        return contract;


    }

}
