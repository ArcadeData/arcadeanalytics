package com.arcadeanalytics.service.dto;

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


import com.arcadeanalytics.domain.enumeration.DataSourceType;
import com.arcadeanalytics.domain.enumeration.IndexingStatus;

import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Objects;

/**
 * A DTO for the DataSource entity.
 */
public class DataSourceDTO implements Serializable {

    private Long id;

    @NotNull
    private String name;

    private String description;

    private DataSourceType type;

    private IndexingStatus indexing;

    private String server;

    private Integer port;

    private String database;

    private String username;

    private String password;

    private Boolean aggregationEnabled;

    private String connectionProperties;

    private Boolean remote;

    private String gateway;

    private Integer sshPort;

    private String sshUser;
    private Boolean skipSslValidation;

    private Long workspaceId;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DataSourceType getType() {
        return type;
    }

    public void setType(DataSourceType type) {
        this.type = type;
    }

    public IndexingStatus getIndexing() {
        return indexing;
    }

    public void setIndexing(IndexingStatus indexing) {
        this.indexing = indexing;
    }

    public String getServer() {
        return server;
    }

    public void setServer(String server) {
        this.server = server;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getAggregationEnabled() {
        return aggregationEnabled;
    }

    public void setAggregationEnabled(Boolean aggregationEnabled) {
        this.aggregationEnabled = aggregationEnabled;
    }

    public String getConnectionProperties() {
        return connectionProperties;
    }

    public void setConnectionProperties(String connectionProperties) {
        this.connectionProperties = connectionProperties;
    }

    public Boolean isRemote() {
        return remote;
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

    public Integer getSshPort() {
        return sshPort;
    }

    public void setSshPort(Integer sshPort) {
        this.sshPort = sshPort;
    }

    public String getSshUser() {
        return sshUser;
    }

    public void setSshUser(String sshUser) {
        this.sshUser = sshUser;
    }

    public Boolean getSkipSslValidation() {
        return skipSslValidation;
    }

    public void setSkipSslValidation(Boolean skipSslValidation) {
        this.skipSslValidation = skipSslValidation;
    }

    public Long getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(Long workspaceId) {
        this.workspaceId = workspaceId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        DataSourceDTO dataSourceDTO = (DataSourceDTO) o;
        if (dataSourceDTO.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), dataSourceDTO.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "DataSourceDTO{" +
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
                ", skipSslValidation='" + getSkipSslValidation() + "'" +
                "}";
    }

}
