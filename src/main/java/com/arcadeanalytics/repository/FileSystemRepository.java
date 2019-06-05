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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class FileSystemRepository {

    private final Logger log = LoggerFactory.getLogger(FileSystemRepository.class);
    private final Path rootPath;

    public FileSystemRepository(@Value("${application.storage.path:target/storage}") String path) {
        rootPath = Paths.get(path).toAbsolutePath().normalize();
        log.info("File system repository storage path:: {} ", rootPath.toAbsolutePath());
    }

    public Path getRootPath() {
        return rootPath;
    }

    public boolean store(String path, byte[] bytes) {

        final Path file = resolve(path);

        log.info("saving content to :: {} ", file.toAbsolutePath());
        try {
            Files.createDirectories(file.getParent());
            if (Files.notExists(file))
                Files.createFile(file);
            Files.write(file, bytes);
            return true;
        } catch (IOException e) {
            log.error("unable to save content to  :: {} due to {} ", file.toAbsolutePath(), e.getMessage());
        }

        return false;
    }

    public byte[] read(String path) {

        final Path file = resolve(path);
        log.info("read content from :: {} ", file.toAbsolutePath());

        try {
            if (Files.exists(file))
                return Files.readAllBytes(file);
        } catch (IOException e) {
            log.error("unable to read content from  :: {} due to {} ", file.toAbsolutePath(), e.getMessage());
        }

        return new byte[]{};
    }


    public boolean delete(String path) {
        final Path file = resolve(path);
        log.info("delete :: {} ", file.toAbsolutePath());

        try {
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            log.error("unable to delete :: {} due to {} ", file.toAbsolutePath(), e.getMessage());
        }

        return false;
    }

    public Path resolve(String path) {

        return rootPath.resolve(path);
    }
}
