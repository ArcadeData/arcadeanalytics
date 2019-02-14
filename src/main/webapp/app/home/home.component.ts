import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { WorkspaceService } from '../entities/workspace';
import { NotificationService } from '../shared/services/notification.service';
import { Account, LoginModalService, Principal } from '../shared';

import { DashboardService } from '../entities/dashboard/dashboard.service';
import { Workspace } from '../entities/workspace/workspace.model';
import { Dashboard } from '../entities/dashboard/dashboard.model';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-home',
    templateUrl: './home.component.html',
    styleUrls: [
        'home.scss'
    ]

})
export class HomeComponent implements OnInit, AfterViewChecked {
    account: Account;
    modalRef: BsModalRef;

    private firstLoadingDone = false;
    private workspaces: Workspace[];
    private dashboards: Dashboard[];

    public redirectEventEmitted: boolean;

    constructor(
        private principal: Principal,
        private loginModalService: LoginModalService,
        private workspaceService: WorkspaceService,
        private dashboardService: DashboardService,
        private notificationService: NotificationService,
        private eventManager: JhiEventManager,
        private router: Router,
    ) {}

    ngOnInit() {
        this.redirectEventEmitted = false;
        if (this.principal['authenticated']) {
            this.principal.identity().then((account) => {
                this.account = account;
            });
        }
        this.registerAuthenticationSuccess();
        if (this.isAuthenticated()) {
            this.loadAllWorkspaces();
            this.loadAllDashboards();
        }
    }

    ngAfterViewChecked() {
        if (this.isAuthenticated() && !this.firstLoadingDone) {
            this.loadAllWorkspaces();
            this.loadAllDashboards();
            this.firstLoadingDone = true;
        }
    }

    registerAuthenticationSuccess() {
        this.eventManager.subscribe('authenticationSuccess', (message) => {
            this.principal.identity().then((account) => {
                this.account = account;
            });
        });
    }

    isAuthenticated() {
        return this.principal.isAuthenticated();
    }

    login() {
        /*
         * if the user is logging in, then we have 2 cases:
         * - this is the first login
         * - previously he logged out
         * in both the cases we set the firstLoadingDone control variable to false
         */
        this.firstLoadingDone = false;

        this.modalRef = this.loginModalService.open();
    }

    loadAllWorkspaces() {
        this.workspaceService.query({
            page: 0,
            size: 1000,
            sort: ['name,asc']
        }).subscribe(
            (res: HttpResponse<Workspace[]>) => {
                this.workspaces = res.body;
            },
            (res: HttpErrorResponse) => {
                let error = res.error;
                if (error.status !== 401 && error.title !== 'Unauthorized') {
                    error += 'The Server didn\'t respond.';
                    this.navigateToErrorPage();
                    this.notificationService.push('error', 'Dashboard', error.message);
                }
            }
        );
    }

    loadAllDashboards() {
        this.dashboardService.query({
            page: 0,
            size: 1000,
            sort: ['name,asc']
        }).subscribe(
            (res: HttpResponse<Dashboard[]>) => {
                this.dashboards = res.body;
                this.navigateToDefaultDashboard();
            },
            (res: HttpErrorResponse) => {
                let error = res.error;
                if (error.status !== 401 && error.title !== 'Unauthorized') {
                    error += 'The Server didn\'t respond.';
                    this.navigateToErrorPage();
                    this.notificationService.push('error', 'Dashboard', error.message);
                }
            }
        );
    }

    navigateToDefaultDashboard() {

        /*
         * check the current user:
         * - admin is the current user -> we get the first dashboard belonging to the admin (we need to filter out the others)
         * - user -> we get the first dashboard
         */

        const currentUserIdentity = this.account['login'];
        const currentUserIdentityId = this.account['id'];

        let dashboardId: number;
        if (currentUserIdentity === 'admin') {
            for (const currentDashboard of this.dashboards) {
                if (currentDashboard['userId'] === currentUserIdentityId) {
                    dashboardId = currentDashboard['id'];
                    const url = 'dashboard/' + dashboardId;
                    this.router.navigate([url]);
                    this.emitDefaultDashboardRedirectEvent(dashboardId);
                    break;
                }
            }
        } else {
            dashboardId = this.dashboards[0]['id'];
            const url = 'dashboard/' + dashboardId;
            this.router.navigate([url]);
            this.emitDefaultDashboardRedirectEvent(dashboardId);
        }
    }

    navigateToErrorPage() {
        const url = 'error';
        this.router.navigate([url]);
    }

    emitDefaultDashboardRedirectEvent(dashboardId: number) {
        if (!this.redirectEventEmitted) {
            this.eventManager.broadcast({
                name: 'dashboardRouteLoaded',
                dashboardId: dashboardId
            });
            this.redirectEventEmitted = true;
        }
    }

}
