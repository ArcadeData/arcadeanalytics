package com.arcadeanalytics.util

import com.arcadeanalytics.repository.FileSystemRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.time.LocalDateTime

internal class LicenceManagerTest {

    @get:Rule
    var folder = TemporaryFolder()


    private lateinit var fs: FileSystemRepository

    @Before
    fun setUp() {
        fs = FileSystemRepository(folder.root.absolutePath)

    }

    @Test
    fun shouldCreateLicenceFileOnFirstStartup() {

        val licenceManager = LicenceManager(fs)
        assertThat(fs.read("arcade.pl")).isNotEmpty()

    }

    @Test
    fun shouldBeValid() {

        val fs = FileSystemRepository(folder.root.absolutePath)
        val licenceManager = LicenceManager(fs)
        assertThat(fs.read("arcade.pl")).isNotEmpty()

        assertThat(licenceManager.isValid()).isTrue()
    }

    @Test
    fun shouldBeInvalid() {

        val fs = FileSystemRepository(folder.root.absolutePath)

        fs.store("arcade.pl", LocalDateTime.now().minusDays(40).toString().toByteArray(Charsets.UTF_8))
        assertThat(fs.read("arcade.pl")).isNotEmpty()

        val licenceManager = LicenceManager(fs)

        assertThat(licenceManager.isValid()).isFalse()
    }

    @Test
    fun shouldReportRemainingDays() {

        val licenceManager = LicenceManager(fs)

        assertThat(licenceManager.days()).isEqualTo(30)

    }
}
