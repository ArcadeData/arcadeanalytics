package com.arcadeanalytics.service.util;

import com.arcadeanalytics.domain.DataSource;
import com.arcadeanalytics.provider.DataSourceInfo;

import java.util.Optional;

public class DataSourceUtil {

    public static DataSourceInfo toDataSourceInfo(DataSource ds) {

        return new DataSourceInfo(Optional.ofNullable(ds.getId()).orElse(-1L),
                ds.getType().name(),
                ds.getName(),
                ds.getDescription(),
                ds.getServer(),
                ds.getPort(),
                Optional.ofNullable(ds.getDatabase()).orElse("N/A"),
                ds.getUsername(),
                ds.getPassword(),
                Optional.ofNullable(ds.isAggregationEnabled()).orElse(false),
                Optional.ofNullable(ds.getConnectionProperties()).orElse("{}"),
                Optional.ofNullable(ds.isRemote()).orElse(false),
                Optional.ofNullable(ds.getGateway()).orElse(""),
                Optional.ofNullable(ds.getSshPort()).orElse(1234),
                Optional.ofNullable(ds.getSshUser()).orElse("")
        );
    }
}
