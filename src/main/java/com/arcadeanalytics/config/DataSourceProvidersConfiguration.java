package com.arcadeanalytics.config;

import com.arcadeanalytics.provider.DataSourceGraphDataProviderFactory;
import com.arcadeanalytics.provider.DataSourceGraphProviderFactory;
import com.arcadeanalytics.provider.DataSourceMetadataProviderFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.io.IOException;

@Configuration
public class DataSourceProvidersConfiguration {
    private final Logger log = LoggerFactory.getLogger(DataSourceProvidersConfiguration.class);

    private final String path;


    public DataSourceProvidersConfiguration(Environment env) throws IOException {

        path = env.getProperty("application.connectorsPath", "./arcade-connectors");

        log.info("connectors paths:: {} ", path);
    }

    @Bean
    public DataSourceGraphDataProviderFactory dataSourceGraphDataProviderFactory() {

        return new DataSourceGraphDataProviderFactory(path);
    }

    @Bean
    public DataSourceGraphProviderFactory dataSourceGraphProviderFactory() {

        return new DataSourceGraphProviderFactory(path);
    }

    @Bean
    public DataSourceMetadataProviderFactory dataSourceMetadataProviderFactory() {

        return new DataSourceMetadataProviderFactory(path);
    }

}
