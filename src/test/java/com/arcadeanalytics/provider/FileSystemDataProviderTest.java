package com.arcadeanalytics.provider;

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
import com.arcadeanalytics.repository.FileSystemRepository;
import com.arcadeanalytics.repository.FileSystemWidgetSnapshotsRepository;
import com.google.common.io.Files;
import org.assertj.core.api.Assertions;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.LongStream;

public class FileSystemDataProviderTest {


    @Rule
    public TemporaryFolder folder = new TemporaryFolder();
    private FileSystemWidgetSnapshotsRepository provider;


    @Before
    public void setUp() throws Exception {
        folder.delete();
        folder.create();

        FileSystemRepository fsRepo = new FileSystemRepository(folder.getRoot().getAbsolutePath());

        provider = new FileSystemWidgetSnapshotsRepository(fsRepo);


    }

    private Widget createSnapshotsForWidget() throws IOException {
        Widget widget = new Widget();
        widget.setId(10l);
        final File widgetStorage = folder.newFolder("widgets", "10");


        LongStream.rangeClosed(0, 9)

            .mapToObj(i -> new File(widgetStorage, "file-" + i))
            .forEach(f -> {
                try {
                    TimeUnit.SECONDS.sleep(1);
                    String content = "{'content':'the content of " + f.getName() + " '}";
                    Files.write(content.getBytes(), f);
                } catch (IOException e) {
                    e.printStackTrace();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });

        return widget;
    }

    @Test
    public void shouldLoadLatestSnapshotContent() throws Exception {


        final Widget widget = createSnapshotsForWidget();

        final Optional<String> fetched = provider.loadLatestSnapshot(widget);

        Assertions.assertThat(fetched).isPresent();

        Assertions.assertThat(fetched.get()).isNotEmpty()
            .isEqualTo("{'content':'the content of file-9 '}");


    }
    @Test
    public void shouldLoadOneSnapshotContent() throws Exception {


        final Widget widget = createSnapshotsForWidget();

        final Optional<String> fetched = provider.loadSnapshot(widget, "file-5");

        Assertions.assertThat(fetched).isPresent();

        Assertions.assertThat(fetched.get()).isNotEmpty()
            .isEqualTo("{'content':'the content of file-5 '}");


    }

    @Test
    public void shouldReturnNotPresent() throws Exception {

        Widget widget = new Widget();
        widget.setId(10l);
        final Optional<String> fetched = provider.loadLatestSnapshot(widget);

        Assertions.assertThat(fetched).isNotPresent();


    }


    @Test
    public void shouldDeleteAllSnapshotOfWidget() throws IOException {

        final Widget widget = createSnapshotsForWidget();

        //verify that snapshots are present

        Assertions.assertThat(provider.loadLatestSnapshot(widget)).isPresent();

        //delete all
        provider.deleteAllSnapshots(widget);

        //verify that no more snapshots are there

        Assertions.assertThat(provider.loadLatestSnapshot(widget)).isNotPresent();

    }

    @Test
    public void shouldFetchAllSnapshots() throws IOException {

        final Widget widget = createSnapshotsForWidget();

        //verify that snapshots are present


        //delete all
        List<String> snapshots= provider.getAllSnapshots(widget);

        //verify that no more snapshots are there

        Assertions.assertThat(snapshots).hasSize(10);

        snapshots.stream().forEach(s-> System.out.println("s = " + s));
    }
}
