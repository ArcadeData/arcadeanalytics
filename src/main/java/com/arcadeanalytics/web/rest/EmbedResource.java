package com.arcadeanalytics.web.rest;

import com.arcadeanalytics.repository.DashboardRepository;
import com.arcadeanalytics.service.WidgetService;
import com.arcadeanalytics.service.dto.DashboardDTO;
import com.arcadeanalytics.service.dto.WidgetDTO;
import com.arcadeanalytics.service.mapper.DashboardMapper;
import com.arcadeanalytics.web.rest.util.PaginationUtil;
import com.codahale.metrics.annotation.Timed;
import io.github.jhipster.web.util.ResponseUtil;
import io.swagger.annotations.ApiParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class EmbedResource {
    private final Logger log = LoggerFactory.getLogger(WidgetResource.class);
    private final WidgetService widgetService;
    private final DashboardRepository dashboardRepository;
    private final DashboardMapper dashboardMapper;

    public EmbedResource(WidgetService widgetService, DashboardRepository dashboardRepository, DashboardMapper dashboardMapper) {
        this.widgetService = widgetService;
        this.dashboardRepository = dashboardRepository;
        this.dashboardMapper = dashboardMapper;
    }


    @GetMapping(value = "/embed/widget/{widgetId}", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @Timed
    public ResponseEntity<String> getSnapshotForEmbed(@PathVariable UUID widgetId) {
        log.debug("REST request to get Widget data to be embedded: {} ", widgetId);
        Optional<String> data = widgetService.getSnapshotForEmbed(widgetId);

        return ResponseUtil.wrapOrNotFound(data);
    }

    @GetMapping(value = "/embed/dashboard/{dashboardId}", produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @Timed
    public ResponseEntity<DashboardDTO> getDashboard(@PathVariable UUID dashboardId) {

        log.debug("REST request to get Dashboard to be embedded : {}", dashboardId);

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(
                dashboardRepository.findOneByUuid(dashboardId)
                        .filter(dashboard -> dashboard.isShared())
                        .map(d -> dashboardMapper.toDto(d))
                        .orElse(null))
        );
    }

    /**
     * GET  /widgets : get all the widgets.
     *
     * @param id       the Widget ID
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of widgets in body
     */
    @GetMapping("/embed//widgets/dashboard/{id}")
    @Timed
    public ResponseEntity<List<WidgetDTO>> getAllDashboardWidgets(@PathVariable Long id, @ApiParam Pageable pageable) {
        log.debug("REST request to get a page of Widgets");
        Page<WidgetDTO> page = widgetService.findAllByDashboard(id, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/widgets");
        return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);
    }

}
