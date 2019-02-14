import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// import { LoginService } from '../../shared';
import { CookieService } from 'ngx-cookie';
import { Principal, AuthServerProvider } from 'app/shared';

@Component({
    selector: 'jhi-auth',
    template: ''
})
export class SocialAuthComponent implements OnInit {

    constructor(
        // private loginService: LoginService,
        private principal: Principal,
        private authServerProvider: AuthServerProvider,
        private cookieService: CookieService,
        private router: Router
    ) {
    }

    ngOnInit() {
        const token = this.cookieService.get('social-authentication');
        if (token.length) {
            this.loginWithToken(token, false).then(() => {
                    this.cookieService.remove('social-authentication');
                    this.router.navigate(['']);
                 }, () => {
                    this.router.navigate(['social-register'], {queryParams: {'success': 'false'}});
            });
        }
    }

    loginWithToken(jwt, rememberMe) {
        return this.authServerProvider.loginWithToken(jwt, rememberMe);
    }
}
