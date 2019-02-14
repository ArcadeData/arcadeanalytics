import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { SERVER_API_URL } from '../../app.constants';

import { DataSource } from './data-source.model';
import { createRequestOption } from '../../shared';

@Injectable({ providedIn: 'root' })
export class DataSourceService {

    private resourceUrl = SERVER_API_URL + 'api/data-sources';
    private resourceSearchUrl = SERVER_API_URL + 'api/_search/data-sources';

    constructor(private http: HttpClient) { }

    create(dataSource: DataSource): Observable<DataSource> {
        return this.http.post(this.resourceUrl, dataSource, { observe: 'response' }).map((res: HttpResponse<DataSource>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    update(dataSource: DataSource): Observable<DataSource> {
        return this.http.put(this.resourceUrl, dataSource, { observe: 'response' }).map((res: HttpResponse<DataSource>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    find(id: number): Observable<DataSource> {
        return this.http.get(`${this.resourceUrl}/${id}`, { observe: 'response' }).map((res: HttpResponse<DataSource>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    query(req?: any, options?: any): Observable<HttpResponse<DataSource[]>> {

        if (!options) {
            options = createRequestOption(req);
        }
        return this.http.get<DataSource[]>(this.resourceUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<DataSource[]>) => this.convertResponse(res));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    search(req?: any): Observable<HttpResponse<DataSource[]>> {
        const options = createRequestOption(req);
        return this.http.get<DataSource[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<DataSource[]>) => this.convertResponse(res));
    }

    loadMetadata(datasourceId: number): Observable<Object> {
        const datasourceResourceUrl: string = this.resourceUrl + '/metadata/' + datasourceId;
        return this.http.get(datasourceResourceUrl, { observe: 'response' })
        .map((res: HttpResponse<Object>) => res.body);
    }

    testConnection(dataSource: DataSource): Observable<Object> {
        const url = this.resourceUrl + '/test';
        return this.http.post<Object>(url, dataSource, { observe: 'response' })
        .map((res: HttpResponse<Object>) => res.body);
    }

    private convertResponse(res: HttpResponse<DataSource[]>): HttpResponse<DataSource[]> {
        const jsonResponse = res.body;
        for (let i = 0; i < jsonResponse.length; i++) {
            jsonResponse[i] = this.convertItemFromServer(jsonResponse[i]);
        }
        return res;
    }

    /**
     * Convert a returned JSON object to DataSource.
     */
    private convertItemFromServer(json: any): DataSource {
        const entity: DataSource = Object.assign(new DataSource(), json);
        return entity;
    }

}
