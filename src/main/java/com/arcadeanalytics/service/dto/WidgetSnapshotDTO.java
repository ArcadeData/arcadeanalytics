package com.arcadeanalytics.service.dto;


import javax.persistence.Lob;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

/**
 * A DTO for the WidgetSnapshot entity.
 */
public class WidgetSnapshotDTO implements Serializable {

    private Long id;

    private LocalDate createdAt;

    @Lob
    private String data;

    private Long widgetId;

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

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public Long getWidgetId() {
        return widgetId;
    }

    public void setWidgetId(Long widgetId) {
        this.widgetId = widgetId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        WidgetSnapshotDTO widgetSnapshotDTO = (WidgetSnapshotDTO) o;
        if (widgetSnapshotDTO.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), widgetSnapshotDTO.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "WidgetSnapshotDTO{" +
                "id=" + getId() +
                ", createdAt='" + getCreatedAt() + "'" +
                ", data='" + getData() + "'" +
                "}";
    }
}
