package com.arcadeanalytics.domain;

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

import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.springframework.data.elasticsearch.annotations.Document;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;


/**
 * A DataSourceIndex.
 */
@Entity
@Table(name = "data_source_index")
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
@Document(indexName = "datasourceindex")
public class DataSourceIndex implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    private Long id;

    @NotNull
    @Column(name = "started_at", nullable = false)
    private LocalDate startedAt;

    @Column(name = "ended_at")
    private LocalDate endedAt;

    @Column(name = "documents")
    private Long documents;

    @Column(name = "status")
    private Boolean status;

    @Column(name = "report")
    private String report;

    @ManyToOne
    private DataSource dataSource;

    // jhipster-needle-entity-add-field - JHipster will add fields here, do not remove
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDate startedAt) {
        this.startedAt = startedAt;
    }

    public DataSourceIndex startedAt(LocalDate startedAt) {
        this.startedAt = startedAt;
        return this;
    }

    public LocalDate getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDate endedAt) {
        this.endedAt = endedAt;
    }

    public DataSourceIndex endedAt(LocalDate endedAt) {
        this.endedAt = endedAt;
        return this;
    }

    public Long getDocuments() {
        return documents;
    }

    public void setDocuments(Long documents) {
        this.documents = documents;
    }

    public DataSourceIndex documents(Long documents) {
        this.documents = documents;
        return this;
    }

    public Boolean isStatus() {
        return status;
    }

    public DataSourceIndex status(Boolean status) {
        this.status = status;
        return this;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public String getReport() {
        return report;
    }

    public void setReport(String report) {
        this.report = report;
    }

    public DataSourceIndex report(String report) {
        this.report = report;
        return this;
    }

    public DataSource getDataSource() {
        return dataSource;
    }

    public void setDataSource(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public DataSourceIndex dataSource(DataSource dataSource) {
        this.dataSource = dataSource;
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
        DataSourceIndex dataSourceIndex = (DataSourceIndex) o;
        if (dataSourceIndex.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), dataSourceIndex.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "DataSourceIndex{" +
                "id=" + getId() +
                ", startedAt='" + getStartedAt() + "'" +
                ", endedAt='" + getEndedAt() + "'" +
                ", documents=" + getDocuments() +
                ", status='" + isStatus() + "'" +
                ", report='" + getReport() + "'" +
                "}";
    }
}
