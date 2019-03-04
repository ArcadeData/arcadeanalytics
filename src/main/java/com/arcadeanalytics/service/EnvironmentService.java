package com.arcadeanalytics.service;

import com.arcadeanalytics.domain.ArcadeUser;
import com.arcadeanalytics.domain.Dashboard;
import com.arcadeanalytics.domain.DataSet;
import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.domain.User;
import com.arcadeanalytics.domain.Widget;
import com.arcadeanalytics.domain.Workspace;
import com.arcadeanalytics.domain.enumeration.ContractType;
import com.arcadeanalytics.provider.FileSystemDataProvider;
import com.arcadeanalytics.repository.ArcadeUserRepository;
import com.arcadeanalytics.repository.CompanyRepository;
import com.arcadeanalytics.repository.DashboardRepository;
import com.arcadeanalytics.repository.DataSetRepository;
import com.arcadeanalytics.repository.DataSourceIndexRepository;
import com.arcadeanalytics.repository.DataSourceRepository;
import com.arcadeanalytics.repository.FileSystemRepository;
import com.arcadeanalytics.repository.WidgetRepository;
import com.arcadeanalytics.repository.WorkspaceRepository;
import com.arcadeanalytics.repository.search.WidgetSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;


/**
 * Support service that provides utility methods to created and destroy a {@link User} environment.
 */
@Service
@Transactional
public class EnvironmentService {

    private static final String TEMPLATE_USER_NAME = "user";

    private final Logger log = LoggerFactory.getLogger(EnvironmentService.class);

    private final WorkspaceRepository workspaceRepository;

    private final DashboardRepository dashboardRepository;

    private final DataSetRepository dataSetRepository;

    private final DataSourceRepository dataSourceRepository;

    private final WidgetRepository widgetRepository;

    private final WidgetSearchRepository widgetSearchRepository;

    private final ArcadeUserRepository arcadeUserRepository;

    private final CompanyRepository companyRepository;

    private final DataSourceIndexRepository dataSourceIndexRepository;

    private final ElasticGraphIndexerService elasticGraphIndexerService;

    private final FileSystemDataProvider fileSystemDataProvider;

    private final String templateUserName;

    public EnvironmentService(WorkspaceRepository workspaceRepository,
                              DashboardRepository dashboardRepository,
                              DataSetRepository dataSetRepository,
                              DataSourceRepository dataSourceRepository,
                              WidgetRepository widgetRepository,
                              WidgetSearchRepository widgetSearchRepository,
                              ArcadeUserRepository arcadeUserRepository,
                              CompanyRepository companyRepository,
                              DataSourceIndexRepository dataSourceIndexRepository,
                              ElasticGraphIndexerService elasticGraphIndexerService,
                              FileSystemRepository fileSystemRepository,
                              Environment env) {
        this.workspaceRepository = workspaceRepository;
        this.dashboardRepository = dashboardRepository;
        this.dataSetRepository = dataSetRepository;
        this.dataSourceRepository = dataSourceRepository;
        this.widgetRepository = widgetRepository;
        this.widgetSearchRepository = widgetSearchRepository;
        this.arcadeUserRepository = arcadeUserRepository;
        this.companyRepository = companyRepository;
        this.dataSourceIndexRepository = dataSourceIndexRepository;
        this.elasticGraphIndexerService = elasticGraphIndexerService;
        this.fileSystemDataProvider = new FileSystemDataProvider(fileSystemRepository);

        templateUserName = env.getProperty("application.templateUser", TEMPLATE_USER_NAME);

        log.info("template user name is:: {}", templateUserName);
    }

    /**
     * Creates a base environment copying {@link Dashboard}s from the template user
     *
     * @param user         the {@link User}
     * @param contractType the {@link ContractType}
     */
    public void createBaseEnvironment(User user, ContractType contractType) {

        log.info("creating default workspace and dashboard for user {} ", user);

        //create arcade user if not present yet
        final ArcadeUser arcadeUser = arcadeUserRepository.findByUser(user)
                .orElseGet(() ->
                        arcadeUserRepository.save(new ArcadeUser()
                                .user(user)
                                .company(companyRepository.findByContractType(contractType))
                        ));

        final Workspace workspace = workspaceRepository.save(
                new Workspace()
                        .name("Workspace for " + user.getLogin())
                        .description("workspace for " + user.getLogin())
                        .user(arcadeUser));


        final Dashboard dashboard = dashboardRepository.save(
                new Dashboard()
                        .name("Dashboard for " + user.getLogin())
                        .description("Dashboard for " + user.getLogin())
                        .workspace(workspace));

        final Boolean created = createDataSources(workspace, dashboard);

        if (created) {
            log.info("created default workspace {} and dashboard {} for user {} with arcadeUSer {}", workspace.getId(), dashboard.getId(), user.getLogin(), arcadeUser.getId());
        } else {
            log.info("some problem occurs while creating workspace {} and dashboard {} for user {}", workspace.getId(), dashboard.getId(), user.getLogin());
        }
    }

    private boolean createDataSources(Workspace workspace, Dashboard dashboard) {

        widgetRepository.findByDashboardWorkspaceUserUserLogin(templateUserName)
                .stream()
                .forEach(widget -> {

                    DataSource userDataSource = widget.getDataSource();

                    DataSource dataSource = dataSourceRepository.save(new DataSource()
                            .name(userDataSource.getName())
                            .description(userDataSource.getDescription())
                            .server(userDataSource.getServer())
                            .type(userDataSource.getType())
                            .port(userDataSource.getPort())
                            .database(userDataSource.getDatabase())
                            .remote(Optional.ofNullable(userDataSource.isRemote()).orElse(false))
                            .aggregationEnabled(Optional.ofNullable(userDataSource.isAggregationEnabled()).orElse(false))
                            .connectionProperties(Optional.ofNullable(userDataSource.getConnectionProperties()).orElse("{}"))
                            .sshUser(userDataSource.getSshUser())
                            .sshPort(userDataSource.getSshPort())
                            .gateway(userDataSource.getGateway())
                            .username(userDataSource.getUsername())
                            .password(userDataSource.getPassword())
                            .workspace(workspace));

                    DataSet dataSet = dataSetRepository.save(new DataSet()
                            .widget(widget)
                            .name(widget.getName()));

                    widgetRepository.save(new Widget()
                            .name(widget.getName())
                            .hasSnapshot(false)
                            .type(widget.getType())
                            .dashboard(dashboard)
                            .dataSource(dataSource))
                            .dataSet(dataSet);

                    //disable indexing of each datasource
                    //elasticGraphIndexerService.index(dataSource);

                });

        return true;
    }

    /**
     * Delete the environment of a {@link User}: {@link Workspace}s, {@link Dashboard}s, {@link DataSource}s
     *
     * @param user the {@link User}
     */
    public void destroyEnvironment(User user) {

        log.info("remove env for user {} ", user);

        final ArcadeUser arcadeUser = arcadeUserRepository.findByUser(user).get();

        final List<Workspace> workspaces = workspaceRepository.findByUser(arcadeUser);

        workspaces.forEach(workspace -> {
            final List<Dashboard> dashboards = dashboardRepository.findByWorkspace(workspace);
            dashboards.forEach(this::deleteDashboard);
            final List<DataSource> dataSources = dataSourceRepository.findByWorkspace(workspace);
            dataSources.forEach(this::deleteDataSource);
            workspaceRepository.delete(workspace);
        });

        arcadeUserRepository.delete(arcadeUser.getId());

        log.info("removed environment for user {} ", user);


    }

    /**
     * Deletes a {@link DataSource}, the full-text index associated and the history of index processing
     *
     * @param dataSource the {@link DataSource}
     */
    public void deleteDataSource(DataSource dataSource) {
        elasticGraphIndexerService.deleteIndex(dataSource);

        dataSource.getDataSourceIndices()
                .stream()
                .forEach(dsi -> dataSourceIndexRepository.delete(dsi));

        dataSourceRepository.delete(dataSource);
    }

    /**
     * Deletes a {@link Dashboard} and all off its {@link Widget}s from search system too
     *
     * @param dashboard the {@link Dashboard}
     */
    public void deleteDashboard(Dashboard dashboard) {
        final List<Widget> widgets = widgetRepository.findByDashboard(dashboard);

        widgets.forEach(widget -> {
            Optional.ofNullable(widget.getDataSet())
                    .ifPresent(dataSetRepository::delete);
            fileSystemDataProvider.deleteAllSnapshots(widget);
            widgetRepository.delete(widget);
            widgetSearchRepository.delete(widget.getId());
        });

        dashboardRepository.delete(dashboard);
    }


}
