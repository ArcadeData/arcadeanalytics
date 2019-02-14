import { Injectable } from '@angular/core';
import { JhiEventManager } from 'ng-jhipster';
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from 'app/shared';

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
    constructor(private eventManager: JhiEventManager,
        protected notificationService: NotificationService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            tap(
                (event: HttpEvent<any>) => {},
                (err: any) => {
                    if (err instanceof HttpErrorResponse) {
                        if (!(err.status === 401 && (err.message === '' || (err.url && err.url.includes('/api/account'))))) {
                            this.eventManager.broadcast({ name: 'proofApp.httpError', content: err });
                        }
                    }
                    if (err.error && err.error.title) {
                        this.notificationService.push('error', err.error.title, err.message);
                    } else {
                        this.notificationService.push('error', undefined, err.message);
                    }
                }
            )
        );
    }
}
