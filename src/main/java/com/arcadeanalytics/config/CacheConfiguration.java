package com.arcadeanalytics.config;

import io.github.jhipster.config.JHipsterProperties;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.ehcache.expiry.Duration;
import org.ehcache.expiry.Expirations;
import org.ehcache.jsr107.Eh107Configuration;

import io.github.jhipster.config.jcache.BeanClassLoaderAwareJCacheRegionFactory;

import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.cache.JCacheManagerCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfiguration {

    private final javax.cache.configuration.Configuration<Object, Object> jcacheConfiguration;

    public CacheConfiguration(JHipsterProperties jHipsterProperties) {
        BeanClassLoaderAwareJCacheRegionFactory.setBeanClassLoader(this.getClass().getClassLoader());
        JHipsterProperties.Cache.Ehcache ehcache =
                jHipsterProperties.getCache().getEhcache();

        jcacheConfiguration = Eh107Configuration.fromEhcacheCacheConfiguration(
                CacheConfigurationBuilder.newCacheConfigurationBuilder(Object.class, Object.class,
                        ResourcePoolsBuilder.heap(ehcache.getMaxEntries()))
                        .withExpiry(Expirations.timeToLiveExpiration(Duration.of(ehcache.getTimeToLiveSeconds(), TimeUnit.SECONDS)))
                        .build());
    }

    @Bean
    public JCacheManagerCustomizer cacheManagerCustomizer() {
        return cm -> {
            cm.createCache(com.arcadeanalytics.repository.UserRepository.USERS_BY_LOGIN_CACHE, jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.repository.UserRepository.USERS_BY_EMAIL_CACHE, jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.User.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Authority.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.User.class.getName() + ".authorities", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.SocialUserConnection.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Workspace.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Workspace.class.getName() + ".dashboards", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Workspace.class.getName() + ".datasources", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Dashboard.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Dashboard.class.getName() + ".widgets", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Dashboard.class.getName() + ".datasets", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Widget.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.DataSource.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.DataSource.class.getName() + ".dataSourceIndices", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.DataSource.class.getName() + ".datasets", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.DataSet.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Media.class.getName(), jcacheConfiguration);
            cm.createCache("modelMappers", jcacheConfiguration);
            cm.createCache("neo4jDrivers", jcacheConfiguration);
            cm.createCache("gremlinClusters", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.DataSetOperation.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.DataSourceIndex.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.DataSet.class.getName() + ".operations", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.ArcadeUser.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.ArcadeUser.class.getName() + ".workspaces", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Workspace.class.getName() + ".dataSources", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Widget.class.getName() + ".snapshots", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Company.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Company.class.getName() + ".users", jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.Contract.class.getName(), jcacheConfiguration);
            cm.createCache(com.arcadeanalytics.domain.WidgetSnapshot.class.getName(), jcacheConfiguration);
            // jhipster-needle-ehcache-add-entry
        };
    }
}
