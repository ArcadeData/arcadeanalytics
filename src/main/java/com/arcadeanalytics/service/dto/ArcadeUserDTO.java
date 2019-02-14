package com.arcadeanalytics.service.dto;


import java.io.Serializable;
import java.util.Objects;

/**
 * A DTO for the ArcadeUser entity.
 */
public class ArcadeUserDTO implements Serializable {

    private Long id;

    private Long userId;

    private Long companyId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ArcadeUserDTO arcadeUserDTO = (ArcadeUserDTO) o;
        if (arcadeUserDTO.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), arcadeUserDTO.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "ArcadeUserDTO{" +
                "id=" + getId() +
                "}";
    }
}
