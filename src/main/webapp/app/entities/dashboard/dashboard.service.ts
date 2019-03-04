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
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { SERVER_API_URL } from '../../app.constants';

import { Dashboard } from './dashboard.model';
import { createRequestOption } from '../../shared';

@Injectable({ providedIn: 'root' })
export class DashboardService {

    private resourceUrl = SERVER_API_URL + 'api/dashboards';
    private resourceSearchUrl = SERVER_API_URL + 'api/_search/dashboards';
    private embedUrl = SERVER_API_URL + 'api/embed/dashboard';

    constructor(private http: HttpClient) { }

    create(dashboard: Dashboard): Observable<Dashboard> {
        return this.http.post(this.resourceUrl, dashboard, { observe: 'response' }).map((res: HttpResponse<Dashboard>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    update(dashboard: Dashboard): Observable<Dashboard> {
        return this.http.put(this.resourceUrl, dashboard, { observe: 'response' }).map((res: HttpResponse<Dashboard>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    find(id: number): Observable<Dashboard> {
        return this.http.get(`${this.resourceUrl}/${id}`, { observe: 'response' }).map((res: HttpResponse<Dashboard>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    findForEmbeddedWidget(UUID: string): Observable<Dashboard> {
        return this.http.get(`${this.embedUrl}/${UUID}`, { observe: 'response' }).map((res: HttpResponse<Dashboard>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    query(req?: any): Observable<HttpResponse<Dashboard[]>> {
        const options = createRequestOption(req);
        return this.http.get(this.resourceUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<Dashboard[]>) => this.convertResponse(res));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    search(req?: any): Observable<HttpResponse<Dashboard[]>> {
        const options = createRequestOption(req);
        return this.http.get<Dashboard[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<Dashboard[]>) => this.convertResponse(res));
    }

    private convertResponse(res: HttpResponse<Dashboard[]>): HttpResponse<Dashboard[]> {
        const jsonResponse: Dashboard[] = res.body;
        for (let i = 0; i < jsonResponse.length; i++) {
            jsonResponse[i] = this.convertItemFromServer(jsonResponse[i]);
        }
        return res;
    }

    /**
     * Convert a returned JSON object to Dashboard.
     */
    private convertItemFromServer(json: any): Dashboard {
        const entity: Dashboard = Object.assign(new Dashboard(), json);
        return entity;
    }

}
