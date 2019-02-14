package com.arcadeanalytics.repository;

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
