import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { SERVER_API_URL } from '../../app.constants';

@Injectable({ providedIn: 'root' })
export class ActivateService {

    constructor(private http: HttpClient) {}

    get(key: string): Observable<HttpResponse<any>> {
        const params: HttpParams = new HttpParams();
        params.set('key', key);

        return this.http.get(SERVER_API_URL + 'api/activate', {
            observe: 'response',
            params: params
        });
    }
}
