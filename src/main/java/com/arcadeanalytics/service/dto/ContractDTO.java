package com.arcadeanalytics.service.dto;


import com.arcadeanalytics.domain.enumeration.ContractType;

import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Objects;

/**
 * A DTO for the Contract entity.
 */
public class ContractDTO implements Serializable {

    private Long id;

    @NotNull
    private String name;

    private String description;

    private ContractType type;

    private Integer maxWorkspaces;

    private Integer maxDashboards;

    private Integer maxWidgets;

    private Integer maxElements;

    private Integer maxTraversal;

    private Integer maxPower;

    private Boolean ha;

    private Integer pollingInterval;

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

    public ContractType getType() {
        return type;
    }

    public void setType(ContractType type) {
        this.type = type;
    }

    public Integer getMaxWorkspaces() {
        return maxWorkspaces;
    }

    public void setMaxWorkspaces(Integer maxWorkspaces) {
        this.maxWorkspaces = maxWorkspaces;
    }

    public Integer getMaxDashboards() {
        return maxDashboards;
    }

    public void setMaxDashboards(Integer maxDashboards) {
        this.maxDashboards = maxDashboards;
    }

    public Integer getMaxWidgets() {
        return maxWidgets;
    }

    public void setMaxWidgets(Integer maxWidgets) {
        this.maxWidgets = maxWidgets;
    }

    public Integer getMaxElements() {
        return maxElements;
    }

    public void setMaxElements(Integer maxElements) {
        this.maxElements = maxElements;
    }

    public Integer getMaxTraversal() {
        return maxTraversal;
    }

    public void setMaxTraversal(Integer maxTraversal) {
        this.maxTraversal = maxTraversal;
    }

    public Integer getMaxPower() {
        return maxPower;
    }

    public void setMaxPower(Integer maxPower) {
        this.maxPower = maxPower;
    }

    public Boolean isHa() {
        return ha;
    }

    public void setHa(Boolean ha) {
        this.ha = ha;
    }

    public Integer getPollingInterval() {
        return pollingInterval;
    }

    public void setPollingInterval(Integer pollingInterval) {
        this.pollingInterval = pollingInterval;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ContractDTO contractDTO = (ContractDTO) o;
        if (contractDTO.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), contractDTO.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "ContractDTO{" +
                "id=" + getId() +
                ", name='" + getName() + "'" +
                ", description='" + getDescription() + "'" +
                ", type='" + getType() + "'" +
                ", maxWorkspaces=" + getMaxWorkspaces() +
                ", maxDashboards=" + getMaxDashboards() +
                ", maxWidgets=" + getMaxWidgets() +
                ", maxElements=" + getMaxElements() +
                ", maxTraversal=" + getMaxTraversal() +
                ", maxPower=" + getMaxPower() +
                ", ha='" + isHa() + "'" +
                ", pollingInterval=" + getPollingInterval() +
                "}";
    }
}
