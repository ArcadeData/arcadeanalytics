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

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.nio.file.Files;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;

public class FileSystemRepositoryTest {


    @Rule
    public TemporaryFolder folder = new TemporaryFolder();


    @Test
    public void shouldStoreData() throws Exception {


        FileSystemRepository fs = new FileSystemRepository(folder.getRoot().getAbsolutePath());


        final byte[] toBeStored = Files.readAllBytes(Paths.get("./src/test/resources/snapshots/data-snapshot.json"));

        fs.store("widget/11/data.json", toBeStored);

        final byte[] fetched = fs.read("widget/11/data.json");

        assertThat(fetched).isEqualTo(toBeStored);

    }

}
