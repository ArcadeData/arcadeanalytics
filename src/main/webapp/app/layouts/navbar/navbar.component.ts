/*-
 * #%L
 * Arcade Analytics
 * %%
 * Copyright (C) 2018 - 2019 ArcadeAnalytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
import { Component, OnInit, OnDestroy, ViewChild, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap';
import { JhiLanguageService, JhiEventManager } from 'ng-jhipster';

import { ProfileService } from '../profiles/profile.service';
import { JhiLanguageHelper, Principal, LoginModalService, LoginService, AuthServerProvider } from '../../shared';

import { VERSION } from '../../app.constants';
import { DashboardService } from '../../entities/dashboard/dashboard.service';
import { NotificationService } from '../../shared/services/notification.service';
import { Dashboard } from '../../entities/dashboard/dashboard.model';
import { Subscription } from 'rxjs';
import { SelectComponent } from 'ng2-select';
import { Workspace } from '../../entities/workspace/workspace.model';
import { WorkspaceService } from '../../entities/workspace/workspace.service';
import { UserService } from '../../shared/user/user.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'jhi-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: [
        'navbar.scss'
    ]
})
export class NavbarComponent implements OnInit, AfterViewChecked, OnDestroy {

    inProduction: boolean;
    isNavbarCollapsed: boolean;
    languages: any[];
    swaggerEnabled: boolean;
    modalRef: BsModalRef;
    version: string;

    workspaces: Workspace[];
    dashboards: Dashboard[];
    dashboardItems: Object[];
    currentSelectedDashboardId: number;
    firstDashboardLoadingDone = false;

    dashboardRouteLoadedSubscriber: Subscription;
    dashboardListModificationSubscriber: Subscription;

    @ViewChild(SelectComponent) select: SelectComponent;

    constructor(
        private principal: Principal,
        private authServerProvider: AuthServerProvider,
        // private loginService: LoginService,
        private languageService: JhiLanguageService,
        private languageHelper: JhiLanguageHelper,
        private loginModalService: LoginModalService,
        private notificationService: NotificationService,
        private userService: UserService,
        private workspaceService: WorkspaceService,
        private dashboardService: DashboardService,
        private profileService: ProfileService,
        private eventManager: JhiEventManager,
        private router: Router
    ) {
        this.version = VERSION ? 'v' + VERSION : '';
        this.isNavbarCollapsed = true;
        this.dashboardItems = [];
    }

    ngOnInit() {
        this.languageHelper.getAll().then((languages) => {
            this.languages = languages;
        });
        if (this.isAuthenticated() && !this.firstDashboardLoadingDone) {
            this.loadAllWorkspaces();
            this.loadAllDashboards();
        }

        this.profileService.getProfileInfo().then((profileInfo) => {
            this.inProduction = profileInfo.inProduction;
            this.swaggerEnabled = profileInfo.swaggerEnabled;
        });

        this.registerDefaultDashboardRedirect();
        this.registerChangeInDashboards();
    }

    ngAfterViewChecked() {
        if (this.isAuthenticated() && !this.firstDashboardLoadingDone) {
            this.loadAllWorkspaces();
            this.loadAllDashboards();
            this.firstDashboardLoadingDone = true;
        }
    }

    ngOnDestroy() {
        if (this.dashboardRouteLoadedSubscriber) {
            this.eventManager.destroy(this.dashboardRouteLoadedSubscriber);
        }
        if (this.dashboardListModificationSubscriber) {
            this.eventManager.destroy(this.dashboardListModificationSubscriber);
        }
    }

    changeLanguage(languageKey: string) {
        this.languageService.changeLanguage(languageKey);
    }

    registerDefaultDashboardRedirect() {
        this.dashboardRouteLoadedSubscriber = this.eventManager.subscribe(
            'dashboardRouteLoaded',
            (response) => {
                this.changeSelection(response['dashboardId']);
            }
        );
    }

    registerChangeInDashboards() {
        this.dashboardListModificationSubscriber = this.eventManager.subscribe('dashboardListModification', (response) => {
            this.loadAllDashboards();
            if (response.content === 'dashboard-upsert') {
                // redirect to the new dashboard
                const dashboardId = response['dashboardId'];
                const url = 'dashboard/' + dashboardId;
                this.router.navigate([url]);
            } else if (response.content === 'dashboard-delete') {
                // redirect to the default dashboard
                const dashboardId = this.dashboardItems[0]['id'];
                const url = 'dashboard/' + dashboardId;
                this.router.navigate([url]);
            }
        });
    }

    /**
     * Changes the current selected value according to the dashboardId passed as param.
     * If no dashboard is found, changing is not performed.
     * @param dashboardId
     */
    changeSelection(dashboardId: number) {
        if (this.select) {

            // look for the correct item according to the dashboard id
            for (const currentItem of this.dashboardItems) {
                if (currentItem['id'] === dashboardId) {
                    this.select.active = [currentItem];
                    this.currentSelectedDashboardId = currentItem['id'];
                    break;
                }
            }
        }
    }

    collapseNavbar() {
        this.isNavbarCollapsed = true;
    }

    isAuthenticated() {
        return this.principal.isAuthenticated();
    }

    login() {
        this.modalRef = this.loginModalService.open();
    }

    logout() {
        this.collapseNavbar();
        this.performLogout();
        this.router.navigate(['']);
        this.firstDashboardLoadingDone = false;
    }

    performLogout() {
        this.authServerProvider.logout().subscribe();
        this.principal.authenticate(null);
    }

    toggleNavbar() {
        this.isNavbarCollapsed = !this.isNavbarCollapsed;
    }

    getImageUrl() {
        return this.isAuthenticated() ? this.principal.getImageUrl() : null;
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
                this.initDashboardsNames();
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

    navigateToCurrentSelectedDashboard() {
        const currentSelectedItem = <any>this.select.active[0];
        const dashboardId = currentSelectedItem['id'];
        const url: string = 'dashboard/' + dashboardId;
        this.router.navigate([url]);
    }

    navigateToErrorPage() {
        const url = 'error';
        this.router.navigate([url]);
    }

    initDashboardsNames() {
        if (this.workspaces) {
            this.dashboardItems = [];
            const addUserInfo = this.principal.hasAnyAuthorityDirect(['ROLE_ADMIN']);
            for (const currentDashboard of this.dashboards) {
                let currentItem;
                if (addUserInfo) {
                    currentItem = {
                        id: currentDashboard.id,
                        text: '[' + currentDashboard['login'] + '] ' + currentDashboard.name
                    };
                } else {
                    currentItem = {
                        id: currentDashboard.id,
                        text: currentDashboard.name
                    };
                }
                this.dashboardItems.push(currentItem);
            }
        } else {
            setTimeout(() => {
                this.initDashboardsNames();
            }, 100);
        }
    }

    getWorkspaceById(workspaceId: number) {
        for (const workspace of this.workspaces) {
            if (workspace.id === workspaceId) {
                return workspace;
            }
        }
        return undefined;
    }

}
