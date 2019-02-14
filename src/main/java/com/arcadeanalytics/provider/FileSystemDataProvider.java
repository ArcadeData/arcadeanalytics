package com.arcadeanalytics.provider;

import com.arcadeanalytics.domain.Widget;
import com.arcadeanalytics.repository.FileSystemRepository;
import com.google.common.base.Charsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static java.util.Collections.reverse;

public class FileSystemDataProvider {

    private final Logger log = LoggerFactory.getLogger(FileSystemDataProvider.class);

    private final FileSystemRepository fsRepo;
    private final Path widgets;

    public FileSystemDataProvider(FileSystemRepository fsRepo) {

        this.fsRepo = fsRepo;
        widgets = fsRepo.getRootPath().resolve("widgets");
    }


    public Optional<String> fetchData(Widget widget) {

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

    public Optional<String> fetchData(Widget widget, String filename) {
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
            log.error("unable delete snapshots for widget {} due to {} ", id, e.getMessage());

        }

        return Collections.emptyList();
    }

}
