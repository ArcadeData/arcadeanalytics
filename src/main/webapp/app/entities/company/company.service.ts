import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { SERVER_API_URL } from '../../app.constants';

import { Company } from './company.model';
import { createRequestOption } from '../../shared';

@Injectable({ providedIn: 'root' })
export class CompanyService {

    private resourceUrl = SERVER_API_URL + 'api/companies';
    private resourceSearchUrl = SERVER_API_URL + 'api/_search/companies';

    constructor(private http: HttpClient) { }

    create(company: Company): Observable<Company> {
        return this.http.post<Company>(this.resourceUrl, company, { observe: 'response' }).map((res: HttpResponse<Company>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    update(company: Company): Observable<Company> {
        return this.http.put<Company>(this.resourceUrl, company, { observe: 'response' }).map((res: HttpResponse<Company>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    find(id: number): Observable<Company> {
        return this.http.get<Company>(`${this.resourceUrl}/${id}`, { observe: 'response' }).map((res: HttpResponse<Company>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    query(req?: any): Observable<HttpResponse<Company[]>> {
        const options = createRequestOption(req);
        return this.http.get<Company[]>(this.resourceUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<Company[]>) => this.convertResponse(res));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    search(req?: any): Observable<HttpResponse<Company[]>> {
        const options = createRequestOption(req);
        return this.http.get<Company[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<Company[]>) => this.convertResponse(res));
    }

    private convertResponse(res: HttpResponse<Company[]>): HttpResponse<Company[]> {
        const jsonResponse: Company[] = res.body;
        for (let i = 0; i < jsonResponse.length; i++) {
            jsonResponse[i] = this.convertItemFromServer(jsonResponse[i]);
        }
        return res;
    }

    /**
     * Convert a returned JSON object to Dashboard.
     */
    private convertItemFromServer(json: any): Company {
        const entity: Company = Object.assign(new Company(), json);
        return entity;
    }

}
