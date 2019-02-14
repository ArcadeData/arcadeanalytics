package com.arcadeanalytics.domain;

import com.arcadeanalytics.domain.enumeration.ContractType;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.springframework.data.elasticsearch.annotations.Document;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Objects;


/**
 * A Contract.
 */
@Entity
@Table(name = "contract")
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
@Document(indexName = "contract")
public class Contract implements Serializable {

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
    private ContractType type;

    @Column(name = "max_workspaces")
    private Integer maxWorkspaces;

    @Column(name = "max_dashboards")
    private Integer maxDashboards;

    @Column(name = "max_widgets")
    private Integer maxWidgets;

    @Column(name = "max_elements")
    private Integer maxElements;

    @Column(name = "max_traversal")
    private Integer maxTraversal;

    @Column(name = "max_power")
    private Integer maxPower;

    @Column(name = "ha")
    private Boolean ha;

    @Column(name = "polling_interval")
    private Integer pollingInterval;

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

    public Contract name(String name) {
        this.name = name;
        return this;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Contract description(String description) {
        this.description = description;
        return this;
    }

    public ContractType getType() {
        return type;
    }

    public void setType(ContractType type) {
        this.type = type;
    }

    public Contract type(ContractType type) {
        this.type = type;
        return this;
    }

    public Integer getMaxWorkspaces() {
        return maxWorkspaces;
    }

    public void setMaxWorkspaces(Integer maxWorkspaces) {
        this.maxWorkspaces = maxWorkspaces;
    }

    public Contract maxWorkspaces(Integer maxWorkspaces) {
        this.maxWorkspaces = maxWorkspaces;
        return this;
    }

    public Integer getMaxDashboards() {
        return maxDashboards;
    }

    public void setMaxDashboards(Integer maxDashboards) {
        this.maxDashboards = maxDashboards;
    }

    public Contract maxDashboards(Integer maxDashboards) {
        this.maxDashboards = maxDashboards;
        return this;
    }

    public Integer getMaxWidgets() {
        return maxWidgets;
    }

    public void setMaxWidgets(Integer maxWidgets) {
        this.maxWidgets = maxWidgets;
    }

    public Contract maxWidgets(Integer maxWidgets) {
        this.maxWidgets = maxWidgets;
        return this;
    }

    public Integer getMaxElements() {
        return maxElements;
    }

    public void setMaxElements(Integer maxElements) {
        this.maxElements = maxElements;
    }

    public Contract maxElements(Integer maxElements) {
        this.maxElements = maxElements;
        return this;
    }

    public Integer getMaxTraversal() {
        return maxTraversal;
    }

    public void setMaxTraversal(Integer maxTraversal) {
        this.maxTraversal = maxTraversal;
    }

    public Contract maxTraversal(Integer maxTraversal) {
        this.maxTraversal = maxTraversal;
        return this;
    }

    public Integer getMaxPower() {
        return maxPower;
    }

    public void setMaxPower(Integer maxPower) {
        this.maxPower = maxPower;
    }

    public Contract maxPower(Integer maxPower) {
        this.maxPower = maxPower;
        return this;
    }

    public Boolean isHa() {
        return ha;
    }

    public Contract ha(Boolean ha) {
        this.ha = ha;
        return this;
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

    public Contract pollingInterval(Integer pollingInterval) {
        this.pollingInterval = pollingInterval;
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
        Contract contract = (Contract) o;
        if (contract.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), contract.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "Contract{" +
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
