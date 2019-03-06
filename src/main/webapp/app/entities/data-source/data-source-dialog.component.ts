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
import { Component, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { DataSource, DataSourceType } from './data-source.model';
import { DataSourcePopupService } from './data-source-popup.service';
import { DataSourceService } from './data-source.service';
import { Workspace, WorkspaceService } from '../workspace';
import { NotificationService } from '../../shared/services/notification.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

/**
 * Used for 'edit-data-source' and 'new-data-source' workflows.
 */
@Component({
    selector: 'jhi-data-source-dialog',
    templateUrl: './data-source-dialog.component.html',
    styleUrls: ['./data-source-dialog.component.scss']
})
export class DataSourceDialogComponent implements OnInit, AfterViewChecked {

    dataSource: DataSource;
    isSaving: boolean;

    // first level data type choice
    datasourceTypes: Object[] = [
        {
            id: 'ORIENTDB',
            text: 'OrientDB'
        },
        {
            id: 'NEO4J',
            text: 'Neo4j'
        },
        {
            id: 'NEO4J_MEMGRAPH',
            text: 'MemGraph'
        },
        {
            id: 'RDBMS',
            text: 'Relational Database'
        },
        {
            id: 'GREMLIN',
            text: 'Gremlin'
        },
        {
            id: 'STARDOG',
            text: 'Stardog (Beta)'
        }
        // ,
        // {
        //     id: 'RDF',
        //     text: 'RDF'
        // }
    ];
    initialDatasourceType: Object = {
        id: 'ORIENTDB',
        text: 'OrientDB'
    };

    // second level data type choice for RDBMS
    rdbmsDatasourceTypes: Object[] = [
        // {
        //     type: 'ORACLE',
        //     name: 'Oracle'
        // },
        // {
        //     type: 'MSSQLSERVER',
        //     name: 'Mycrosoft SQL Server'
        // },
        {
            type: 'MYSQL',
            name: 'MySQL'
        },
        {
            type: 'POSTGRESQL',
            name: 'PostgreSQL'
        },
        {
            type: 'HSQL',
            name: 'Hyper SQL'
        }        ,
        {
            type: 'DATA_WORLD',
            name: 'Data World (Beta)'
        }
    ];

    // second level data type choice for GREMLIN
    gremlinDatasourceTypes: Object[] = [
        {
            type: 'ORIENTDB',
            name: 'OrientDB'
        },
        {
            type: 'NEPTUNE',
            name: 'Neptune'
        },
        {
            type: 'COSMOSDB',
            name: 'Cosmos'
        },
        {
            type: 'JANUSGRAPH',
            name: 'JanusGraph'
        }
    ];

    // first level choice for data type
    datasourceType: string;

    // second level choice for rdbms data type
    rdbmsType: string;

    // second level choice for gremlin implementation
    gremlinImpl: string;

    datasourceInfoLoaded: boolean = false;
    workspaces: Workspace[];

    canTestConnection: boolean = false;

    // Connection properties
    connectionPropsView: boolean = false;
    tableColumns: Object[] = [
        {
            id: 'propertyName',
            text: 'Property Name'
        },
        {
            id: 'propertyValue',
            text: 'Property Value'
        },
        {
            id: 'propertyValue',
            text: ''
        }
    ];
    connectionProperties: Object[] = [];
    newCurrentProperty: Object = {
        propertyName: '',
        propertyValue: ''
    };

    // aggregation strategy flag
    aggregationStrategyEnabled: boolean = false;

    constructor(
        public bsModalRef: BsModalRef,
        private dataSourceService: DataSourceService,
        private workspaceService: WorkspaceService,
        private eventManager: JhiEventManager,
        private notificationService: NotificationService
    ) {

    }

    ngOnInit() {
        this.isSaving = false;
        this.workspaceService.query()
            .subscribe((res: HttpResponse<Workspace[]>) => { this.workspaces = res.body; }, (res: HttpErrorResponse) => this.onError(res.error));
    }

    ngAfterViewChecked() {
        if (!this.datasourceInfoLoaded && this.dataSource) {

            setTimeout(() => {  // timeout added to avoid ExpressionChangedAfterItHasBeenCheckedError
                // loading from datasource
                if (this.dataSource['type']) {
                    this.initDatasourceTypes();
                } else {  // creating new datasource, then populating with default values
                    this.datasourceType = 'ORIENTDB';  // by default
                    this.rdbmsType = 'ORACLE';  // by default
                    this.gremlinImpl = 'ORIENTDB';  // by default
                }

                // loading connection properties
                if (this.dataSource['connectionProperties'] !== undefined) {
                    const propertiesMap: Object = JSON.parse(this.dataSource['connectionProperties']);
                    if (Object.keys(propertiesMap).length > 0) {
                        for (const key of Object.keys(propertiesMap)) {
                            const currentConnectionProperty = {
                                propertyName: key,
                                propertyValue: propertiesMap[key]
                            };
                            this.connectionProperties.push(currentConnectionProperty);
                        }
                    }
                }
                if (this.connectionProperties.length > 0) {
                    this.connectionPropsView = true;
                }

                this.updateDatasourceType();

                // check if all need info for text connection are present
                this.updateTestConnectionFlag();
            }, 100);

            this.datasourceInfoLoaded = true;
        }
    }

    initDatasourceTypes() {

        const type: string = this.dataSource['type'].toString();

        switch (type) {

            case 'ORIENTDB':
                this.datasourceType = 'ORIENTDB';
                this.initialDatasourceType = {
                    id: 'ORIENTDB',
                    text: 'OrientDB'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'GREMLIN_ORIENTDB':
                this.datasourceType = 'GREMLIN';
                this.initialDatasourceType = {
                    id: 'GREMLIN',
                    text: 'Gremlin'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'GREMLIN_NEPTUNE':
                this.datasourceType = 'GREMLIN';
                this.initialDatasourceType = {
                    id: 'GREMLIN',
                    text: 'Gremlin'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'NEPTUNE';  // by default
                break;

            case 'GREMLIN_COSMOSDB':
                this.datasourceType = 'GREMLIN';
                this.initialDatasourceType = {
                    id: 'GREMLIN',
                    text: 'Gremlin'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'COSMOSDB';  // by default
                break;

            case 'GREMLIN_JANUSGRAPH':
                this.datasourceType = 'GREMLIN';
                this.initialDatasourceType = {
                    id: 'GREMLIN',
                    text: 'Gremlin'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'JANUSGRAPH';  // by default
                break;

            case 'NEO4J':
                this.datasourceType = 'NEO4J';
                this.initialDatasourceType = {
                    id: 'NEO4J',
                    text: 'Neo4j'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;
            case 'NEO4J_MEMGRAPH':
                this.datasourceType = 'NEO4J_MEMGRAPH';
                this.initialDatasourceType = {
                    id: 'NEO4J_MEMGRAPH',
                    text: 'Memgraph'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'RDBMS_ORACLE':
                this.datasourceType = 'RDBMS';
                this.initialDatasourceType = {
                    id: 'RDBMS',
                    text: 'Relational Database'
                };
                this.rdbmsType = 'ORACLE';
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'RDBMS_MSSQLSERVER':
                this.datasourceType = 'RDBMS';
                this.initialDatasourceType = {
                    id: 'RDBMS',
                    text: 'Relational Database'
                };
                this.rdbmsType = 'MSSQLSERVER';
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'RDBMS_MYSQL':
                this.datasourceType = 'RDBMS';
                this.initialDatasourceType = {
                    id: 'RDBMS',
                    text: 'Relational Database'
                };
                this.rdbmsType = 'MYSQL';
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'RDBMS_POSTGRESQL':
                this.datasourceType = 'RDBMS';
                this.initialDatasourceType = {
                    id: 'RDBMS',
                    text: 'Relational Database'
                };
                this.rdbmsType = 'POSTGRESQL';
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'RDBMS_HSQL':
                this.datasourceType = 'RDBMS';
                this.initialDatasourceType = {
                    id: 'RDBMS',
                    text: 'Relational Database'
                };
                this.rdbmsType = 'HSQL';
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'RDBMS_DATA_WORLD':
                this.datasourceType = 'RDBMS';
                this.initialDatasourceType = {
                    id: 'RDBMS',
                    text: 'Relational Database'
                };
                this.rdbmsType = 'DATA_WORLD';
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'RDF':
                this.datasourceType = 'RDF';
                this.initialDatasourceType = {
                    id: 'RDF',
                    text: 'RDF'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'ORIENTDB';  // by default
                break;

            case 'STARDOG':
                this.datasourceType = 'STARDOG';
                this.initialDatasourceType = {
                    id: 'STARDOG',
                    text: 'Stardog'
                };
                this.rdbmsType = 'ORACLE';  // by default
                this.gremlinImpl = 'STARDOG';  // by default
                break;
        }
    }

    updateDatasourceTypeFromEvent(event) {
        this.datasourceType = event['id'];
        this.updateDatasourceType();
    }

    updateTestConnectionFlag() {

        if (this.dataSource['type'] !== undefined && this.dataSource['server'] && this.dataSource['port'] && this.dataSource['database']) {
            if (!this.dataSource.remote) {
                this.canTestConnection = true;
            } else {
                // we check also other fields bound to the remote connection
                if (this.dataSource['gateway'] && this.dataSource['sshUser'] && this.dataSource['sshPort']) {
                    this.canTestConnection = true;
                } else {
                    this.canTestConnection = false;
                }
            }
        } else {
            this.canTestConnection = false;
        }
    }

    clear() {
        this.bsModalRef.hide();
    }

    testConnection() {

        const infoNotification = this.notificationService.push('info', 'Data Source Connection', 'Testing connection...', 20000, 'fa fa-spinner fa-spin');

        this.populateConnectionPropertiesFieldFromTable();
        this.dataSourceService.testConnection(this.dataSource).subscribe((res: Object) => {
                const message = 'Connection alive';
                this.notificationService.updateNotification(infoNotification, 'success', 'Data Source Connection', message, undefined, true);
            }, (error: HttpErrorResponse) => {
                const message = 'Connection NOT alive';
                this.notificationService.updateNotification(infoNotification, 'error', 'Data Source Connection', message, undefined, true);
                console.log(error.message);
            });
    }

    save() {
        this.isSaving = true;

        // saving datasource type
        this.updateDatasourceType();

       this.populateConnectionPropertiesFieldFromTable();

       // if description is empty it will be filled with the datasource name
       if (!this.dataSource['description']) {
        this.dataSource['description'] = this.dataSource['name'];
       }

        if (this.dataSource.id !== undefined) {
            this.subscribeToSaveResponse(
                this.dataSourceService.update(this.dataSource));
        } else {
            this.subscribeToSaveResponse(
                this.dataSourceService.create(this.dataSource));
        }

        this.bsModalRef.hide();
    }

    populateConnectionPropertiesFieldFromTable() {
        const connectionPropertiesMap = {};
        for (const connectionProperty of this.connectionProperties) {
            connectionPropertiesMap[connectionProperty['propertyName']] = connectionProperty['propertyValue'];
        }
        this.dataSource['connectionProperties'] = JSON.stringify(connectionPropertiesMap);
    }

    updateDatasourceType() {

        switch (this.datasourceType) {
            case 'ORIENTDB':
                this.dataSource['type'] = DataSourceType.ORIENTDB;
                break;

            case 'GREMLIN':
                if (this.gremlinImpl === 'ORIENTDB') {
                    this.dataSource['type'] = DataSourceType.GREMLIN_ORIENTDB;
                } else if (this.gremlinImpl === 'NEPTUNE') {
                    this.dataSource['type'] = DataSourceType.GREMLIN_NEPTUNE;
                } else if (this.gremlinImpl === 'COSMOSDB') {
                    this.dataSource['type'] = DataSourceType.GREMLIN_COSMOSDB;
                } else if (this.gremlinImpl === 'JANUSGRAPH') {
                    this.dataSource['type'] = DataSourceType.GREMLIN_JANUSGRAPH;
                }
                break;

            case 'NEO4J':
                this.dataSource['type'] = DataSourceType.NEO4J;
                break;

            case 'NEO4J_MEMGRAPH':
                this.dataSource['type'] = DataSourceType.NEO4J_MEMGRAPH;
                break;

            case 'RDBMS':
                if (this.rdbmsType === 'ORACLE') {
                    this.dataSource['type'] = DataSourceType.RDBMS_ORACLE;
                } else if (this.rdbmsType === 'MSSQLSERVER') {
                    this.dataSource['type'] = DataSourceType.RDBMS_MSSQLSERVER;
                } else if (this.rdbmsType === 'MYSQL') {
                    this.dataSource['type'] = DataSourceType.RDBMS_MYSQL;
                } else if (this.rdbmsType === 'POSTGRESQL') {
                    this.dataSource['type'] = DataSourceType.RDBMS_POSTGRESQL;
                } else if (this.rdbmsType === 'HSQL') {
                    this.dataSource['type'] = DataSourceType.RDBMS_HSQL;
                } else if (this.rdbmsType === 'DATA_WORLD') {
                    this.dataSource['type'] = DataSourceType.RDBMS_DATA_WORLD;
                }
                break;

            case 'RDF':
                this.dataSource['type'] = DataSourceType.RDF;
                break;

            case 'STARDOG':
                this.dataSource['type'] = DataSourceType.STARDOG;
                break;
        }

        // check if connection test is available
        this.updateTestConnectionFlag();
    }

    addNewConnectionProperty() {
        const newProp = JSON.parse(JSON.stringify(this.newCurrentProperty));
        this.connectionProperties.push(newProp);
        this.newCurrentProperty = {
            propertyName: '',
            propertyValue: ''
        };
    }

    removeNewConnectionProperty(propertyName) {

        let index: number = 0;
        for (const currProperty of this.connectionProperties) {
            if (currProperty['propertyName'] === propertyName) {
                this.connectionProperties.splice(index, 1);
                break;
            }
            index++;
        }
    }

    private subscribeToSaveResponse(result: Observable<DataSource>) {
        result.subscribe((res: DataSource) =>
            this.onSaveSuccess(res), (res: HttpErrorResponse) => this.onSaveError(res.error));
    }

    private onSaveSuccess(result: DataSource) {
        this.eventManager.broadcast({ name: 'dataSourceModification', content: 'OK' });
        this.isSaving = false;
        this.bsModalRef.hide();
    }

    private onSaveError(error: any) {
        this.isSaving = false;
        this.notificationService.push('error', 'Data Source creation failed', error.title);
    }

    private onError(error: any) {
        this.notificationService.push('error', 'Data Source init error', error.title);
    }

    trackWorkspaceById(index: number, item: Workspace) {
        return item.id;
    }

}

@Component({
    selector: 'jhi-data-source-popup',
    template: ''
})
export class DataSourcePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private dataSourcePopupService: DataSourcePopupService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if (params['id']) {
                this.dataSourcePopupService
                    .open(DataSourceDialogComponent as Component, params['id']);
            } else {
                this.dataSourcePopupService
                    .open(DataSourceDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
