import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { SERVER_API_URL } from '../../app.constants';

import { Contract } from './contract.model';
import { createRequestOption } from '../../shared';

@Injectable({ providedIn: 'root' })
export class ContractService {

    private resourceUrl = SERVER_API_URL + 'api/contracts';
    private resourceSearchUrl = SERVER_API_URL + 'api/_search/contracts';

    constructor(private http: HttpClient) { }

    create(contract: Contract): Observable<Contract> {
        return this.http.post(this.resourceUrl, contract, { observe: 'response' }).map((res: HttpResponse<Contract>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    update(contract: Contract): Observable<Contract> {
        return this.http.put(this.resourceUrl, contract, { observe: 'response' }).map((res: HttpResponse<Contract>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    find(id: number): Observable<Contract> {
        return this.http.get(`${this.resourceUrl}/${id}`, { observe: 'response' }).map((res: HttpResponse<Contract>) => {
            const jsonResponse = res.body;
            return this.convertItemFromServer(jsonResponse);
        });
    }

    query(req?: any): Observable<HttpResponse<Contract[]>> {
        const options = createRequestOption(req);
        return this.http.get<Contract[]>(this.resourceUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<Contract[]>) => this.convertResponse(res));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    search(req?: any): Observable<HttpResponse<Contract[]>> {
        const options = createRequestOption(req);
        return this.http.get<Contract[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
        .map((res: HttpResponse<Contract[]>) => this.convertResponse(res));
    }

    private convertResponse(res: HttpResponse<Contract[]>): HttpResponse<Contract[]> {
        const jsonResponse: Contract[] = res.body;
        for (let i = 0; i < jsonResponse.length; i++) {
            jsonResponse[i] = this.convertItemFromServer(jsonResponse[i]);
        }
        return res;
    }

    /**
     * Convert a returned JSON object to Dashboard.
     */
    private convertItemFromServer(json: any): Contract {
        const entity: Contract = Object.assign(new Contract(), json);
        return entity;
    }

}
