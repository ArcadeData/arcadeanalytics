import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
// import { LoginService } from '../../shared/login/login.service';
import { Principal, AuthServerProvider } from 'app/shared';

@Injectable()
export class AuthExpiredInterceptor implements HttpInterceptor {

    constructor(private principal: Principal,
        private authServerProvider: AuthServerProvider) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            tap(
                (event: HttpEvent<any>) => {},
                (err: any) => {
                    if (err instanceof HttpErrorResponse) {
                        if (err.status === 401) {
                            this.logout();
                        }
                    }
                }
            )
        );
    }

    logout() {
        this.authServerProvider.logout().subscribe();
        this.principal.authenticate(null);
    }

}
