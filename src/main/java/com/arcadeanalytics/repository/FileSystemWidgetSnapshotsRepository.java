package com.arcadeanalytics.repository;

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

import com.arcadeanalytics.domain.Widget;
import com.google.common.base.Charsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static java.util.Collections.reverse;

/**
 * File system based repository for snapshot of {@link Widget}s
 */
@Component
public class FileSystemWidgetSnapshotsRepository {

    public static final String SNAPSHOT_PREFIX = "data-snapshot-";

    private final Logger log = LoggerFactory.getLogger(FileSystemWidgetSnapshotsRepository.class);

    private final FileSystemRepository fsRepo;
    private final Path widgets;

    public FileSystemWidgetSnapshotsRepository(FileSystemRepository fsRepo) {

        this.fsRepo = fsRepo;
        widgets = fsRepo.getRootPath().resolve("widgets");
    }


    public boolean storeSnapshot(Widget widget, String data) {

        final String file = "widgets/"
                + widget.getId().toString()
                + "/"
                + SNAPSHOT_PREFIX
                + DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(LocalDateTime.now());

        return fsRepo.store(file, data.getBytes());

    }

    public Optional<String> loadLatestSnapshot(Widget widget) {

        final Long id = widget.getId();

        try {
            return Files.find(widgets.resolve(id.toString()), 1, (path, attrs) -> attrs.isRegularFile())
                    .max(Comparator.comparingLong(p -> p.toFile().lastModified()))
                    .flatMap(file -> {
                        log.info("getting data from {}", file);
                        try {
                            return Optional.of(new String(Files.readAllBytes(file), Charsets.UTF_8));
                        } catch (IOException e) {
                            log.error("unable to get snapshot for widget {} due to {} ", widget.getId(), e.getMessage());
                            return Optional.empty();
                        }
                    });

        } catch (IOException e) {
            log.error("unable to get snapshot for widget {} due to {} ", widget.getId(), e.getMessage());
            return Optional.empty();
        }

    }

    public Optional<String> loadSnapshot(Widget widget, String filename) {
        final Long id = widget.getId();

        final Path file = widgets.resolve(id.toString()).resolve(filename);
        log.info("getting data from {}", file);
        try {
            return Optional.of(new String(Files.readAllBytes(file), Charsets.UTF_8));
        } catch (IOException e) {
            log.error("unable to get snapshot for widget {} due to {} ", widget.getId(), e.getMessage());
            return Optional.empty();
        }


    }


    public void deleteAllSnapshots(Widget widget) {

        final Long id = widget.getId();
        log.info("deleting snapshots of widget:: {} ", id);

        try {
            Files.find(widgets.resolve(id.toString()), 1, (path, attrs) -> attrs.isRegularFile())
                    .peek(path -> log.info("deleting snapshot:: {} ", path))
                    .map(file -> file.toFile())
                    .forEach(file -> file.delete());

        } catch (IOException e) {
            log.error("unable delete snapshots for widget {} due to {} ", id, e.getMessage());

        }

    }

    public boolean deleteSnapshot(Widget widget, String filename) {

        final Long id = widget.getId();

        final Path file = widgets.resolve(id.toString()).resolve(filename);
        log.info("deleting snapshot :: {}", file);
        try {
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            log.error("unable to delete snapshot {} due to {} ", filename, e.getMessage());
            return false;
        }

    }


    public List<String> getAllSnapshots(Widget widget) {
        final Long id = widget.getId();
        log.info("getting all snapshots of widget:: {} ", id);

        try {
            final List<String> snapshots = Files.find(widgets.resolve(id.toString()), 1, (path, attrs) -> attrs.isRegularFile())
                    .sorted()
                    .peek(path -> log.info("found snapshot:: {} ", path))
                    .map(file -> file.getFileName().toString())
                    .collect(Collectors.toList());
            reverse(snapshots);
            return snapshots;
        } catch (IOException e) {
            log.error("unable to get snapshots for widget {} due to {} ", id, e.getMessage());

        }

        return Collections.emptyList();
    }

}
