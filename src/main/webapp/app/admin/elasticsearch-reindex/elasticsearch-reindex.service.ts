import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';

@Injectable({ providedIn: 'root' })
export class ElasticsearchReindexService {

    constructor(
      private http: HttpClient
    ) { }

    reindex(): Observable<any> {
        return this.http.post('api/elasticsearch/index', {});
    }
}
