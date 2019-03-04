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


import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

/**
 * A DTO for the DataSourceIndex entity.
 */
public class DataSourceIndexDTO implements Serializable {

    private Long id;

    @NotNull
    private LocalDate startedAt;

    private LocalDate endedAt;

    private Long documents;

    private Boolean status;

    private String report;

    private Long dataSourceId;

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

    public LocalDate getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDate endedAt) {
        this.endedAt = endedAt;
    }

    public Long getDocuments() {
        return documents;
    }

    public void setDocuments(Long documents) {
        this.documents = documents;
    }

    public Boolean isStatus() {
        return status;
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

    public Long getDataSourceId() {
        return dataSourceId;
    }

    public void setDataSourceId(Long dataSourceId) {
        this.dataSourceId = dataSourceId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        DataSourceIndexDTO dataSourceIndexDTO = (DataSourceIndexDTO) o;
        if (dataSourceIndexDTO.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), dataSourceIndexDTO.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "DataSourceIndexDTO{" +
                "id=" + getId() +
                ", startedAt='" + getStartedAt() + "'" +
                ", endedAt='" + getEndedAt() + "'" +
                ", documents=" + getDocuments() +
                ", status='" + isStatus() + "'" +
                ", report='" + getReport() + "'" +
                "}";
    }
}
