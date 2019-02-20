package com.arcadeanalytics.domain.enumeration;

/**
 * The DataSourceType enumeration.
 */
public enum DataSourceType {
    ORIENTDB {
        @Override
        public String connectionUrl() {
            return "remote:{server}:{port}/{database}";
        }

        @Override
        public String language() {
            return "osql";
        }
    }, GREMLIN_ORIENTDB {
        @Override
        public String connectionUrl() {
            return "remote:{server}:{port}/{database}";
        }

        @Override
        public String language() {
            return "gremlin";
        }
    }, GREMLIN_NEPTUNE {
        @Override
        public String connectionUrl() {
            return "{server}:{port}";
        }

        @Override
        public String language() {
            return "gremlin";
        }
    }, GREMLIN_COSMOSDB {
        @Override
        public String connectionUrl() {
            return "{server}:{port}";
        }

        @Override
        public String language() {
            return "gremlin";
        }
    }, GREMLIN_JANUSGRAPH {
        @Override
        public String connectionUrl() {
            return "{server}:{port}";
        }

        @Override
        public String language() {
            return "gremlin";
        }
    }, NEO4J {
        @Override
        public String connectionUrl() {
            return "bolt://{server}:{port}";
        }

        @Override
        public String language() {
            return "cypher";
        }
    }, NEO4J_MEMGRAPH {
        @Override
        public String connectionUrl() {
            return "bolt://{server}:{port}";
        }

        @Override
        public String language() {
            return "cypher";
        }
    }, JANUSGRAPH {
        @Override
        public String connectionUrl() {
            return null;
        }

        @Override
        public String language() {
            return "gremlin";
        }

    }, TIGERGRAPH {
        @Override
        public String connectionUrl() {
            return null;
        }

        @Override
        public String language() {
            return null;
        }
    }, RDBMS_ORACLE {
        @Override
        public String connectionUrl() {
            return "jdbc:oracle:thin:@{server}:{port}:{database}";
        }

        @Override
        public String language() {
            return "sql";
        }
    }, RDBMS_MSSQLSERVER {
        @Override
        public String connectionUrl() {
            return "jdbc:sqlserver://{server}:{port};databaseName={database}";
        }

        @Override
        public String language() {
            return "sql";
        }

    }, RDBMS_MYSQL {
        @Override
        public String connectionUrl() {
            return "jdbc:mysql://{server}:{port}/{database}?nullNamePatternMatchesAll=true&autoReconnect=true&useSSL=false";
        }

        @Override
        public String language() {
            return "sql";
        }

    }, RDBMS_POSTGRESQL {
        @Override
        public String connectionUrl() {
            return "jdbc:postgresql://{server}:{port}/{database}";

        }

        @Override
        public String language() {
            return "sql";
        }

    }, RDBMS_HSQL {
        @Override
        public String connectionUrl() {
            return "jdbc:hsqldb:{server}:{database}";
        }

        @Override
        public String language() {
            return "sql";
        }

    }, RDBMS_DATA_WORLD {
        @Override
        public String connectionUrl() {

            //"jdbc:data:world:[language]:[user id]:[dataset id]"
            return "jdbc:data:world:sql:{server}:{database}";
        }

        @Override
        public String language() {
            return "sql";
        }

    }, RDF {
        @Override
        public String connectionUrl() {
            return null;
        }

        @Override
        public String language() {
            return "sparql";
        }

    }, STARDOG {
        @Override
        public String connectionUrl() {
            return null;
        }

        @Override
        public String language() {
            return "sparql";
        }

    }, ARANGO {
        @Override
        public String connectionUrl() {
            return null;
        }

        @Override
        public String language() {
            return "asql";
        }

    };


    public abstract String connectionUrl();

    public abstract String language();


}

