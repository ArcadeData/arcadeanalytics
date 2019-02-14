package com.arcadeanalytics.service.dto;


import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

/**
 * A DTO for the DataSetOperation entity.
 */
public class DataSetOperationDTO implements Serializable {

    private Long id;

    @NotNull
    private LocalDate createdAt;

    @NotNull
    private String operation;

    private Long datasetId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public Long getDatasetId() {
        return datasetId;
    }

    public void setDatasetId(Long dataSetId) {
        this.datasetId = dataSetId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        DataSetOperationDTO dataSetOperationDTO = (DataSetOperationDTO) o;
        if (dataSetOperationDTO.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), dataSetOperationDTO.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "DataSetOperationDTO{" +
                "id=" + getId() +
                ", createdAt='" + getCreatedAt() + "'" +
                ", operation='" + getOperation() + "'" +
                "}";
    }
}
