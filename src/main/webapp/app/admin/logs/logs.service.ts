import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';

import { Log } from './log.model';

@Injectable({ providedIn: 'root' })
export class LogsService {
    constructor(private http: HttpClient) { }

    changeLevel(log: Log): Observable<any> {
        return this.http.put('management/logs', log);
    }

    findAll(): Observable<HttpResponse<Log[]>> {
        return this.http.get<Log[]>('management/logs', { observe: 'response' });
    }
}
