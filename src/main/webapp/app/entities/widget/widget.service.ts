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
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { SERVER_API_URL } from '../../app.constants';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

import { Widget } from './widget.model';
import { createRequestOption } from '../../shared';

@Injectable({ providedIn: 'root' })
export class WidgetService {

    private resourceUrl = SERVER_API_URL + 'api/widgets';
    private mediaUrl = SERVER_API_URL + 'api/media';
    private resourceSearchUrl = SERVER_API_URL + 'api/_search/widgets';
    private searchUrl = SERVER_API_URL + 'api/_search/data-sources';
    private embedUrl = SERVER_API_URL + 'api/embed/widget';
    private embedResourcesUrl = SERVER_API_URL + 'api/embed/widgets/dashboard';

    private headers: HttpHeaders;

    constructor(private http: HttpClient) {
        this.headers = new HttpHeaders({ 'Content-Type': 'application/json;' });
    }

    create(widget: Widget): Observable<Widget> {
        return this.http.post(this.resourceUrl, widget, { observe: 'response', headers: this.headers }).map((res: HttpResponse<Widget>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    update(widget: Widget): Observable<Widget> {
        return this.http.put(this.resourceUrl, widget, { observe: 'response' }).map((res: HttpResponse<Widget>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    find(id: number): Observable<Widget> {
        return this.http.get(`${this.resourceUrl}/${id}`, { observe: 'response' }).map((res: HttpResponse<Widget>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    query(req?: any): Observable<HttpResponse<Widget[]>> {
        const options = createRequestOption(req);
        return this.http.get<Widget[]>(this.resourceUrl, { params: options, observe: 'response' })
            .map((res: HttpResponse<Widget[]>) => this.convertResponse(res));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    search(req?: any): Observable<HttpResponse<Widget[]>> {
        const options = createRequestOption(req);
        return this.http.get<Widget[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
            .map((res: HttpResponse<Widget[]>) => this.convertResponse(res));
    }

    /**
     * Services for data loading
     */

    loadDataFromQuery(widgetId: number, jsonContent: string): Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/data/' + widgetId;
        return this.http.post(dataResourceUrl, jsonContent, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    loadNodesFromIds(widgetId: number, jsonParams: string): Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/load/' + widgetId;
        return this.http.post(dataResourceUrl, jsonParams, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    loadElementsFromClasses(widgetId: number, jsonContent: string): Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/load-from-classes/' + widgetId;
        return this.http.post(dataResourceUrl, jsonContent, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    loadImpliedConnections(widgetId: number, jsonContent: string):  Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/edges/' + widgetId;
        return this.http.post(dataResourceUrl, jsonContent, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    loadTabledata(widgetId: number, jsonContent: string): Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/table-data/' + widgetId;
        return this.http.post(dataResourceUrl, jsonContent, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    /**
     * It invokes the closed service to fetch the last snapshot for ta specific widget
     * @param widgetId
     * @param req
     */
    loadSnapshot(widgetId: number, req?: Object): Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/snapshot/' + widgetId;
        let httpParams;
        if (req) {
            httpParams = new HttpParams()
                .append('fileName', req['fileName']);
        } else {
            httpParams = new HttpParams()
                .append('fileName', 'last');
        }
        return this.http.get(dataResourceUrl, { observe: 'response', params: httpParams, headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    /**
     * It invokes the closed service to fetch the last snapshot for ta specific widget
     * @param widgetId
     * @param req
     */
    deleteSnapshot(widgetId: number, req?: Object): Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/snapshot/' + widgetId;
        let httpParams;
        if (req) {
            httpParams = new HttpParams()
                .append('fileName', req['fileName']);
        } else {
            httpParams = new HttpParams()
                .append('fileName', 'last');
        }
        return this.http.delete(dataResourceUrl, { observe: 'response', params: httpParams, headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    /**
     * It invokes the closed service to fetch the last snapshot for ta specific widget
     * @param widgetUUID
     * @param req
     */
    loadSnapshotForEmbeddedWidget(widgetUUID: string, req?: Object): Observable<Object> {
        const url = this.embedUrl + '/' + widgetUUID;
        return this.http.get(url, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    loadSnapshotsNames(widgetId: number): Observable<Object> {
        const dataResourceUrl: string = this.resourceUrl + '/snapshots/' + widgetId;
        return this.http.get(dataResourceUrl, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<string[]>) => res.body);
    }

    traverseRelationshipFromNodes(widgetId: number, jsonContent: string): Observable<Object> {
        const traverseResourceUrl: string = this.resourceUrl + '/traverse/' + widgetId;
        return this.http.post(traverseResourceUrl, jsonContent, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    loadMedia(page: string, size: string): Observable<Object> {
        const params: HttpParams = new HttpParams()
            .set('page', page)
            .set('size', size);
        return this.http.get(this.mediaUrl, { params: params, observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    /**
     * Services for widget saving
     */

    updateWidget(widgetId: number, jsonContent: string, updateData?: boolean): Observable<HttpResponse<any>> {

        let saveResourceUrl: string = this.resourceUrl + '/snapshot/' + widgetId;
        if (updateData) {
            if (updateData === true) {
                saveResourceUrl += 'data';
            } else {
                saveResourceUrl += 'meta';
            }
        }
        return this.http.put(saveResourceUrl, jsonContent, { observe: 'response' });
    }

    layout(layoutType: string, jsonContent: string): Observable<Object> {
        const layoutResourceUrl: string = this.resourceUrl + '/layout/' + layoutType;
        return this.http.post(layoutResourceUrl, jsonContent, { observe: 'response' })
            .map((res: HttpResponse<Object>) => res.body);
    }

    getWidgetsByDashboardId(dashboardId: number, req?: any): Observable<HttpResponse<Widget[]>> {
        const options = createRequestOption(req);
        const url = this.resourceUrl + '/dashboard/' + dashboardId;
        return this.http.get<Widget[]>(url, { params: options, observe: 'response' })
            .map((res: HttpResponse<Widget[]>) => this.convertResponse(res));
    }

    getWidgetsByEmbeddedDashboardId(dashboardId: number, req?: any): Observable<HttpResponse<Widget[]>> {
        const options = createRequestOption(req);
        return this.http.get<Widget[]>(`${this.embedResourcesUrl}/${dashboardId}`, { params: options, observe: 'response' })
            .map((res: HttpResponse<Widget[]>) => this.convertResponse(res));
    }

    /**
     * Methods handling full text search with the server.
     * @param terms
     * @returns {Observable<R>|any}
     */
    fulltextSearch(terms: Observable<string>, datasourceId, filteringIds?: string[]): Observable<HttpResponse<Object[]>> {
        return terms.debounceTime(400)
            .distinctUntilChanged()
            .switchMap((term) =>
                this.fulltextSearchEntries(term, datasourceId, filteringIds));
    }

    /**
     * Auxiliary function of fulltextSearch.
     * @param term
     * @returns {OperatorFunction<T, R>}
     */
    fulltextSearchEntries(term, datasourceId, filteringIds?): Observable<HttpResponse<Object[]>> {

        const jsonParams = {
            query: term
        };
        if (filteringIds) {
            jsonParams['ids'] = filteringIds;
        }
        return this.http.post<Object[]>(`${this.searchUrl}/${datasourceId}`, jsonParams, { observe: 'response', headers: this.headers });
    }

    /**
     * Index operational calls
     */

    callDatasourceIndexing(datasourceId): Observable<Object> {
        return this.http.get(`${this.searchUrl}/index/${datasourceId}`, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    fetchAllFacetsFromDatasource(datasourceId: number): Observable<Object> {
        return this.http.get(`${this.searchUrl}/aggregate/${datasourceId}`, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    fetchFacetsForDataset(datasourceId: number, ids: string[], classes: string[], fields: string[],
        useEdges?: boolean, query?: string, minDocCount?: number, maxValuesPerField?: number): Observable<Object> {
        const jsonParams = {
            ids: ids,
            useEdges: true
        };
        if (useEdges) {
            jsonParams['useEdges'] = true;
        }
        if (query) {
            jsonParams['query'] = query;
        }

        let httpParams = new HttpParams();

        if (classes && classes.length > 0) {
            classes.forEach((className) => {
                httpParams = httpParams.append('classes', className);
            });
        }

        if (fields && fields.length > 0) {
            fields.forEach((fieldName) => {
                httpParams = httpParams.append('fields', fieldName);
            });
        }

        let minDocCountParam = '1';
        let maxValuesPerFieldParam = '15';
        if (minDocCount) {
            minDocCountParam = minDocCount + '';
        }
        if (maxValuesPerField) {
            maxValuesPerFieldParam = maxValuesPerField + '';
        }

        httpParams = httpParams.set('minDocCount', minDocCountParam)
            .set('maxValuesPerField', maxValuesPerFieldParam);

        return this.http.post(`${this.searchUrl}/aggregate/${datasourceId}`, jsonParams, { observe: 'response', params: httpParams, headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);

    }

    fetchWholeFacetingForDatasource(datasourceId: number, classes: string[], fields: string[],
        minDocCount: number, maxValuesPerField: number): Observable<Object> {
        let params = new HttpParams();

        classes.forEach((className) => {
            params = params.append('classes', className);
        });

        fields.forEach((fieldName) => {
            params = params.append('fields', fieldName);
        });

        params = params.set('minDocCount', minDocCount + '')
            .set('maxValuesPerField', maxValuesPerField + '');

        const url = `${this.searchUrl}/aggregate/${datasourceId}`;
        return this.http.get(url, { observe: 'response', params: params, headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    /**
     * Server side graph algorithm service
     */
    algorithm(algorithmName: string, jsonContent: string): Observable<Object> {
        const algorithmResourceUrl: string = this.resourceUrl + '/algorithm/' + algorithmName;
        return this.http.post(algorithmResourceUrl, jsonContent, { observe: 'response', headers: this.headers })
            .map((res: HttpResponse<Object>) => res.body);
    }

    private convertResponse(res: HttpResponse<Widget[]>): HttpResponse<Widget[]> {
        const jsonResponse = res.body;
        for (let i = 0; i < jsonResponse.length; i++) {
            jsonResponse[i] = this.convertItemFromServer(jsonResponse[i]);
        }
        return res;
    }

    /**
     * Convert a returned JSON object to DataSource.
     */
    private convertItemFromServer(json: any): Widget {
        const entity: Widget = Object.assign(new Widget(), json);
        return entity;
    }
}
