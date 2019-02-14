package com.arcadeanalytics.service.dto;


import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Objects;

/**
 * A DTO for the DataSet entity.
 */
public class DataSetDTO implements Serializable {

    private Long id;

    @NotNull
    private String name;

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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        DataSetDTO dataSetDTO = (DataSetDTO) o;
        if (dataSetDTO.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), dataSetDTO.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "DataSetDTO{" +
                "id=" + getId() +
                ", name='" + getName() + "'" +
                "}";
    }
}
