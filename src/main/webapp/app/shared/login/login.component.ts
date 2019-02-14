import { Component, AfterViewInit, Renderer, ElementRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Router } from '@angular/router';
import { JhiEventManager, JhiLanguageService } from 'ng-jhipster';
import { TranslateService } from '@ngx-translate/core';
import { LoginService } from '../../shared/login/login.service';
import { StateStorageService } from '../auth/state-storage.service';
import { SocialService } from '../social/social.service';
import { NotificationService } from '../services/notification.service';
import { Principal, AuthServerProvider } from '..';
import { JhiTrackerService } from '../tracker/tracker.service';

@Component({
    selector: 'jhi-login-modal',
    templateUrl: './login.component.html'
})
export class JhiLoginModalComponent implements AfterViewInit {

    authenticationError: boolean;
    password: string;
    rememberMe: boolean;
    username: string;
    credentials: any;

    constructor(
        public  bsModalRef: BsModalRef,
        private eventManager: JhiEventManager,
        private loginService: LoginService,
        private stateStorageService: StateStorageService,
        private elementRef: ElementRef,
        private renderer: Renderer,
        private socialService: SocialService,
        private router: Router,
        private notificationService: NotificationService,
        private translateService: TranslateService,
        private trackerService: JhiTrackerService,
        private languageService: JhiLanguageService,
        private principal: Principal,
        private authServerProvider: AuthServerProvider
    ) {
        this.credentials = {};
    }

    ngAfterViewInit() {
        this.renderer.invokeElementMethod(this.elementRef.nativeElement.querySelector('#username'), 'focus', []);
    }

    cancel() {
        this.credentials = {
            username: null,
            password: null,
            rememberMe: true
        };
        this.authenticationError = false;
        this.bsModalRef.hide();
    }

    login() {
        this.performLogin({
            username: this.username,
            password: this.password,
            rememberMe: this.rememberMe
        }).then(() => {
            this.authenticationError = false;
            this.bsModalRef.hide();
            if (this.router.url === '/register' || (/^\/activate\//.test(this.router.url)) ||
                (/^\/reset\//.test(this.router.url))) {
                this.router.navigate(['']);
            }

            this.eventManager.broadcast({
                name: 'authenticationSuccess',
                content: 'Sending Authentication Success'
            });

            // previousState was set in the authExpiredInterceptor before being redirected to login modal.
            // since login is successful, go to stored previousState and clear previousState
            const redirect = this.stateStorageService.getUrl();
            if (redirect) {
                this.stateStorageService.storeUrl(null);
                this.router.navigate([redirect]);
            }

            // login notification
            let text = undefined;
            this.translateService.get('login.messages.success.successPrefix').subscribe((mess) => {
                text = mess;
            });
            text +=  '<strong>' + this.username + '</strong>.';

            this.notificationService.push('success', 'Login', text);

        }).catch(() => {
            this.authenticationError = true;
        });
    }

    register() {
        this.bsModalRef.hide();
        this.router.navigate(['/register']);
    }

    requestResetPassword() {
        this.bsModalRef.hide();
        this.router.navigate(['/reset', 'request']);
    }

    performLogin(credentials, callback?) {
        const cb = callback || function() {};

        return new Promise((resolve, reject) => {
            this.authServerProvider.login(credentials).subscribe((data) => {
                this.principal.identity(true).then((account) => {
                    // After the login the language will be changed to
                    // the language selected by the user during his registration
                    if (account !== null) {
                        this.languageService.changeLanguage(account.langKey);
                    }
                    this.trackerService.sendActivity();
                    resolve(data);
                });
                return cb();
            }, (err) => {
                this.performLogout();
                reject(err);
                return cb(err);
            });
        });
    }

    performLogout() {
        this.authServerProvider.logout().subscribe();
        this.principal.authenticate(null);
    }

}
