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

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.springframework.data.elasticsearch.annotations.Document;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.PrePersist;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;


/**
 * A Widget.
 */
@Entity
@Table(name = "widget")
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
@Document(indexName = "widget")
public class Widget implements Serializable {


    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    private Long id;
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "jhi_type")
    private String type;
    @Column(name = "has_snapshot")
    private Boolean hasSnapshot;
    @Column(name = "is_shared")
    private Boolean isShared;
    @Column(name = "primary_widget_id")
    private Long primaryWidgetId;
    @Column(name = "uuid")
    private UUID uuid;
    @OneToOne
    @JoinColumn(unique = true)
    private DataSet dataSet;
    @OneToMany(mappedBy = "widget")
    @JsonIgnore
    @Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
    private Set<WidgetSnapshot> snapshots = new HashSet<>();
    @ManyToOne
    private DataSource dataSource;
    @ManyToOne
    private Dashboard dashboard;


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

    public Widget name(String name) {
        this.name = name;
        return this;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Widget type(String type) {
        this.type = type;
        return this;
    }

    public Boolean isHasSnapshot() {
        return hasSnapshot;
    }

    public Widget hasSnapshot(Boolean hasSnapshot) {
        this.hasSnapshot = hasSnapshot;
        return this;
    }

    public void setHasSnapshot(Boolean hasSnapshot) {
        this.hasSnapshot = hasSnapshot;
    }

    public Boolean isShared() {
        return isShared;
    }

    public Boolean getShared() {
        return isShared;
    }

    public void setShared(Boolean shared) {
        isShared = shared;
    }

    public Widget shared(Boolean shared) {
        isShared = shared;
        return this;
    }

    public DataSet getDataSet() {
        return dataSet;
    }

    public void setDataSet(DataSet dataSet) {
        this.dataSet = dataSet;
    }

    public Widget dataSet(DataSet dataSet) {
        this.dataSet = dataSet;
        return this;
    }

    public Set<WidgetSnapshot> getSnapshots() {
        return snapshots;
    }

    public void setSnapshots(Set<WidgetSnapshot> widgetSnapshots) {
        this.snapshots = widgetSnapshots;
    }

    public Widget snapshots(Set<WidgetSnapshot> widgetSnapshots) {
        this.snapshots = widgetSnapshots;
        return this;
    }

    public Widget addSnapshot(WidgetSnapshot widgetSnapshot) {
        this.snapshots.add(widgetSnapshot);
        widgetSnapshot.setWidget(this);
        return this;
    }

    public Widget removeSnapshot(WidgetSnapshot widgetSnapshot) {
        this.snapshots.remove(widgetSnapshot);
        widgetSnapshot.setWidget(null);
        return this;
    }

    public DataSource getDataSource() {
        return dataSource;
    }

    public void setDataSource(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Widget dataSource(DataSource dataSource) {
        this.dataSource = dataSource;
        return this;
    }

    public Dashboard getDashboard() {
        return dashboard;
    }

    public void setDashboard(Dashboard dashboard) {
        this.dashboard = dashboard;
    }

    public Widget dashboard(Dashboard dashboard) {
        this.dashboard = dashboard;
        return this;
    }

    public Long getPrimaryWidgetId() {
        return primaryWidgetId;
    }

    public void setPrimaryWidgetId(Long primaryWidgetId) {
        this.primaryWidgetId = primaryWidgetId;
    }

    public Widget primaryWidgetId(Long primaryWidgetId) {
        this.primaryWidgetId = primaryWidgetId;
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
        Widget widget = (Widget) o;
        if (widget.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), widget.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "Widget{" +
                "id=" + getId() +
                ", name='" + getName() + "'" +
                ", type='" + getType() + "'" +
                ", hasSnapshot='" + isHasSnapshot() + "'" +
                "}";
    }

    public UUID getUuid() {
        return uuid;
    }

    public void setUuid(UUID uuid) {
        this.uuid = uuid;
    }

    @PrePersist
    void preInsert() {
        if (this.uuid == null)
            this.uuid = UUID.randomUUID();
    }

}
