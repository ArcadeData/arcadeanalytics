package com.arcadeanalytics.domain;

import com.arcadeanalytics.domain.enumeration.DataSourceType;
import com.arcadeanalytics.domain.enumeration.IndexingStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.springframework.data.elasticsearch.annotations.Document;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;


/**
 * A DataSource.
 */
@Entity
@Table(name = "data_source")
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
@Document(indexName = "datasource")
public class DataSource implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    private Long id;

    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "jhi_type")
    private DataSourceType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "indexing")
    private IndexingStatus indexing;

    @Column(name = "server")
    private String server;

    @Column(name = "port")
    private Integer port;

    @Column(name = "jhi_database")
    private String database;

    @Column(name = "username")
    private String username;

    @Column(name = "jhi_password")
    private String password;

    @Column(name = "aggregation_enabled")
    private Boolean aggregationEnabled;

    @Column(name = "connection_properties")
    private String connectionProperties;

    @Column(name = "remote")
    private Boolean remote;

    @Column(name = "gateway")
    private String gateway;

    @Column(name = "ssh_port")
    private Integer sshPort;

    @Column(name = "ssh_user")
    private String sshUser;

    @OneToMany(mappedBy = "dataSource", cascade = CascadeType.ALL)
    @JsonIgnore
    @Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
    private Set<DataSourceIndex> dataSourceIndices = new HashSet<>();

    @ManyToOne
    private Workspace workspace;

    // jhipster-needle-entity-add-field - JHipster will add fields here, do not remove
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public DataSource name(String name) {
        this.name = name;
        return this;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DataSource description(String description) {
        this.description = description;
        return this;
    }

    public DataSourceType getType() {
        return type;
    }

    public void setType(DataSourceType type) {
        this.type = type;
    }

    public DataSource type(DataSourceType type) {
        this.type = type;
        return this;
    }

    public IndexingStatus getIndexing() {
        return indexing;
    }

    public void setIndexing(IndexingStatus indexing) {
        this.indexing = indexing;
    }

    public DataSource indexing(IndexingStatus indexing) {
        this.indexing = indexing;
        return this;
    }

    public String getServer() {
        return server;
    }

    public void setServer(String server) {
        this.server = server;
    }

    public DataSource server(String server) {
        this.server = server;
        return this;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public DataSource port(Integer port) {
        this.port = port;
        return this;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public DataSource database(String database) {
        this.database = database;
        return this;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public DataSource username(String username) {
        this.username = username;
        return this;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public DataSource password(String password) {
        this.password = password;
        return this;
    }

    public Boolean isAggregationEnabled() {
        return aggregationEnabled;
    }

    public void setAggregationEnabled(Boolean aggregationEnabled) {
        this.aggregationEnabled = aggregationEnabled;
    }

    public DataSource aggregationEnabled(Boolean aggregationEnabled) {
        this.aggregationEnabled = aggregationEnabled;
        return this;
    }

    public String getConnectionProperties() {
        return connectionProperties;
    }

    public void setConnectionProperties(String connectionProperties) {
        this.connectionProperties = connectionProperties;
    }

    public DataSource connectionProperties(String connectionProperties) {
        this.connectionProperties = connectionProperties;
        return this;
    }

    public Boolean isRemote() {
        return remote;
    }

    public DataSource remote(Boolean remote) {
        this.remote = remote;
        return this;
    }

    public void setRemote(Boolean remote) {
        this.remote = remote;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public DataSource gateway(String gateway) {
        this.gateway = gateway;
        return this;
    }

    public Integer getSshPort() {
        return sshPort;
    }

    public void setSshPort(Integer sshPort) {
        this.sshPort = sshPort;
    }

    public DataSource sshPort(Integer sshPort) {
        this.sshPort = sshPort;
        return this;
    }

    public String getSshUser() {
        return sshUser;
    }

    public void setSshUser(String sshUser) {
        this.sshUser = sshUser;
    }

    public DataSource sshUser(String sshUser) {
        this.sshUser = sshUser;
        return this;
    }

    public Set<DataSourceIndex> getDataSourceIndices() {
        return dataSourceIndices;
    }

    public void setDataSourceIndices(Set<DataSourceIndex> dataSourceIndices) {
        this.dataSourceIndices = dataSourceIndices;
    }

    public DataSource dataSourceIndices(Set<DataSourceIndex> dataSourceIndices) {
        this.dataSourceIndices = dataSourceIndices;
        return this;
    }

    public DataSource addDataSourceIndex(DataSourceIndex dataSourceIndex) {
        this.dataSourceIndices.add(dataSourceIndex);
        dataSourceIndex.setDataSource(this);
        return this;
    }

    public DataSource removeDataSourceIndex(DataSourceIndex dataSourceIndex) {
        this.dataSourceIndices.remove(dataSourceIndex);
        dataSourceIndex.setDataSource(null);
        return this;
    }

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public DataSource workspace(Workspace workspace) {
        this.workspace = workspace;
        return this;
    }
    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here, do not remove

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        DataSource dataSource = (DataSource) o;
        if (dataSource.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), dataSource.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "DataSource{" +
                "id=" + getId() +
                ", name='" + getName() + "'" +
                ", description='" + getDescription() + "'" +
                ", type='" + getType() + "'" +
                ", indexing='" + getIndexing() + "'" +
                ", server='" + getServer() + "'" +
                ", port=" + getPort() +
                ", database='" + getDatabase() + "'" +
                ", username='" + getUsername() + "'" +
                ", password='" + getPassword() + "'" +
                ", remote='" + isRemote() + "'" +
                ", gateway='" + getGateway() + "'" +
                ", sshPort=" + getSshPort() +
                ", sshUser='" + getSshUser() + "'" +
                "}";
    }
}
