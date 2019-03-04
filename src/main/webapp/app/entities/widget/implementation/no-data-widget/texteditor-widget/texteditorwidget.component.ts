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
import {
    Component, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges,
    ChangeDetectorRef,
    ViewChild
} from '@angular/core';
import { NoDataWidgetComponent } from '../nodatawidget.component';
import { WidgetService } from '../../../widget.service';
import { NotificationService, Base64Service, Principal } from '../../../../../shared';
import { DataSourceService } from '../../../../data-source/data-source.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { JhiEventManager } from 'ng-jhipster';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { SnapshotMenuComponent } from '../..';
import { pageContentPadding } from 'app/global';
import { Router } from '@angular/router';

declare var CKEDITOR: any;

@Component({
    selector: 'texteditor-widget',
    templateUrl: './texteditorwidget.component.html',
    styleUrls: ['./texteditorwidget.component.scss']
})
export class TextEditorWidgetComponent extends NoDataWidgetComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

    dashboardPanelResizedSubscriber: Subscription;
    widgetListModEventSubscribption: Subscription;
    textEditorDraggetSubscriber: Subscription;
    textEditorReady: boolean = false;

    content: string = '';
    config: Object;

    // snapshot loading
    snapshotAlreadyLoaded: boolean = false;

    // snapshot menu
    @ViewChild('snapshotMenu') snapshotMenu: SnapshotMenuComponent;

    constructor(protected principal: Principal,
        protected widgetService: WidgetService,
        protected notificationService: NotificationService,
        protected dataSourceService: DataSourceService,
        protected eventManager: JhiEventManager,
        protected cdr: ChangeDetectorRef,
        protected modalService: BsModalService,
        protected base64Service: Base64Service,
        protected router: Router) {

        super(principal, widgetService, notificationService, dataSourceService, eventManager, cdr, modalService, base64Service, router);
    }

    ngOnInit() {

        // widget id init
        this.widgetId = this.widget['id'];

        this.registerChangeInDashboards();
        this.initConfig();

        this.loadWidget();

        CKEDITOR.on('instanceCreated', ( event, data ) => {
            const editorInstances = event.editor;
            editorInstances.name = 'editor_' + this.widgetId;
        } );
    }

    ngOnChanges(changes: SimpleChanges): void {

        // handling resizing of the minimized version inside the dashboard page
        if (changes['widgetHeight'] && this.minimizedView && this.textEditorReady) {  // this control avoids resizing at the first input variable change, during the component init
            const editorInstances: string[] = Object.keys(CKEDITOR.instances);
            const ckeditorInstance = CKEDITOR.instances[editorInstances[0]];
            if (ckeditorInstance) {
                const height = this.widgetHeight.replace('px', '');
                ckeditorInstance.resize('100%', height, true);
            }
        }
    }

    ngOnDestroy() {
        this.dashboardPanelResizedSubscriber.unsubscribe();
    }

    ngAfterViewInit() {
        this.sidebarResetMenu();

        if (this.embedded) {
            this.adjustWidgetHeightToEmbeddingIframeHeight();
        }

        // possible overflow handling
        this.tooltipOnOverflow();
    }

    registerChangeInDashboards() {
        this.dashboardPanelResizedSubscriber = this.eventManager.subscribe(
            'dashboardPanelResized',
            (response) => {
                if (response.content === this.widgetId) {
                    console.log('Text Editor widget #' + this.widgetId + ' detected resize in minimized view.');
                }
            }
        );

        this.textEditorDraggetSubscriber = this.eventManager.subscribe('dragEnd', (event) => {
                this.refreshTextEditorContent();
        });

        this.widgetListModEventSubscribption = this.eventManager.subscribe('widgetListModification', (response) => {
            // all the events fired because of widgets' or widgets list editing could broke the text editor content, then we have to refresh it
            this.refreshTextEditorContent();
        });
    }

    refreshTextEditorContent() {
        const newContent = this.content.slice(0);   // copy the string
        this.content = undefined;
        setTimeout(() => {
            this.changeContent(newContent);
        }, 100);
    }

    /**
     * Called in minimized view to make links clickable
     * @param event
     */
    makeLinksClickable(event) {
        const ckeditorInstance = event.editor;
        const editable = ckeditorInstance.editable();
        editable.attachListener(editable, 'click', (evt) => {
            const link = new CKEDITOR.dom.elementPath(evt.data.getTarget(), this).contains('a');
            if (link && evt.data.$.button !== 2 && link.isReadOnly()) {
                window.open(link.getAttribute('href'));
            }
        }, null, null, 15);
    }

    initConfig() {
        if (this.minimizedView) {
            this.config = {
                height: this.widgetHeight,
                removePlugins: 'elementspath',
                resize_enabled: false
            };
        } else {
            this.config = {
                height: this.widgetHeight
            };
        }
    }

    tooltipOnOverflow() {
        (<any>$('.mightOverflow')).bind('mouseover', function() {
            const $this = $(this);
            const width = (<any>$('span')).width();
            if (this.offsetWidth > width && !$this.attr('title')) {
                $this.attr('title', $this.text());
            }
        });
    }

    loadWidget() {

        if (this.oldSnapshotToLoad) {
            this.loadSnapshot();
        }
        this.textEditorReady = true;
    }

    loadSnapshot() {
        if (this.embedded) {
            // use the open service to load the snapshot
            this.widgetService.loadSnapshotForEmbeddedWidget(this.widget['uuid']).subscribe((res: Object) => {
                const snapshot = res;
                this.performSnapshotLoading(snapshot);
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.notificationService.push('error', 'Widget not available', this.notSharedWidgetMessage);
            });
        } else {
            //  use the closed service to load the snpashot
            this.widgetService.loadSnapshot(this.widgetId).subscribe((res: Object) => {
                const snapshot = res;
                this.performSnapshotLoading(snapshot);
            }, (error: HttpErrorResponse) => {
                this.stopSpinner();
                this.handleError(error.error, 'Snapshot loading');
            });
        }
    }

    performSnapshotLoading(snapshot) {
        this.updateTextEditorFromSnapshot(snapshot);
        this.snapshotAlreadyLoaded = true;
    }

    saveAll() {

        const infoNotification = this.notificationService.push('info', 'Save', 'Saving the widget...', 3000, 'fa fa-spinner fa-spin');

        const json = {
            content: this.content
        };
        const jsonContent = JSON.stringify(json);

        this.widgetService.updateWidget(this.widgetId, jsonContent).subscribe((res: HttpResponse<any>) => {
            if (res.status === 200 || res.status === 204) {
                const message: string = 'Data correctly saved.';
                this.notificationService.updateNotification(infoNotification, 'success', 'Save', message, undefined, true);

                // updating to-save flag
                this.toSave = false;

                // updating snapshot-menu
                if (this.snapshotMenu) {
                    this.snapshotMenu.loadSnapshotsNames();
                }
            } else {
                const message = 'Saving attempt failed.\n' + 'Response status: ' + res.status;
                this.notificationService.updateNotification(infoNotification, 'error', 'Save', message, undefined, true);
            }
        }, (error: HttpErrorResponse) => {
            this.notificationService.updateNotification(infoNotification, 'error', 'Save', 'Saving attempt failed.', undefined, true);
            console.log(error.error);
        });
    }

    setToSave() {
        if (!this.toSave) {
            this.toSave = true;
        }
    }

    updateTextEditorFromSnapshot(snapshot) {
        this.changeContent(snapshot['content']);
        setTimeout(() => {
            this.toSave = false;
        }, 1000);
    }

    changeContent(text: string) {
        this.content = text;
    }

    getEmptyWidgetMessageHeight() {
        const widgetHeight: number = parseInt(this.widgetHeight.replace('px', ''), 10);
        const top: string = widgetHeight / 3 + 'px';
        return top;
    }

    /*
     * Sidebar handling
     */

    sidebarResetMenu() {

        // Add 'active' class to parent list item in all levels
        $('.navigation').find('li.active').parents('li').addClass('active');

        // Hide all nested lists
        $('.navigation').find('li').not('.active, .category-title').has('ul').children('ul').addClass('hidden-ul');

        // Highlight children links
        $('.navigation').find('li').has('ul').children('a').addClass('has-ul');

        $('.navigation-main').find('li').has('ul').children('a').unbind('click');
        $('.navigation-main').find('li').has('ul').children('a').on('click', function(e) {
            e.preventDefault();

            // Collapsible
            $(this).parent('li')
                .not('.disabled')
                .not($('.sidebar-xs')
                    .not('.sidebar-xs-indicator')
                    .find('.navigation-main')
                    .children('li'))
                .toggleClass('active')
                .children('ul')
                .slideToggle(250);

            // Accordion
            if ($('.navigation-main').hasClass('navigation-accordion')) {
                $(this).parent('li')
                    .not('.disabled')
                    .not($('.sidebar-xs')
                        .not('.sidebar-xs-indicator')
                        .find('.navigation-main')
                        .children('li'))
                    .siblings(':has(.has-ul)')
                    .removeClass('active')
                    .children('ul')
                    .slideUp(250);
            }
        });

        this.toggleOverflowMenu();
    }

    toggleSideBar() {

        if (this.sidebarCollapsed) {
            this.expandSidebar();
        } else {
            this.collapseSidebar();
        }
    }

    checkSidebarStatusOnExit() {
        if (this.sidebarCollapsed) {
            (<any>$('body')).removeClass('sidebar-xs');
        }
    }

    collapseSidebar() {

        const initialSidebarSize = (<any>$('.sidebar')).width();
        (<any>$('body')).addClass('sidebar-xs');
        const finalSidebarSize = (<any>$('.sidebar')).width();

        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.toggleOverflowMenu();
    }

    expandSidebar() {

        const initialSidebarSize = (<any>$('.sidebar')).width();
        (<any>$('body')).removeClass('sidebar-xs');
        const finalSidebarSize = (<any>$('.sidebar')).width();

        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.toggleOverflowMenu();
    }

    toggleOverflowMenu() {

        if (this.sidebarCollapsed) {
            // remove 'vertical-overflow-scroll' from element with 'cell-content-wrapper' class
            $('#sidebar-dynamic').removeClass('vertical-overflow-scroll');

            // add 'submenu-vertical-overflow' to element with 'hidden-ul' class
            $('.hidden-ul').addClass('submenu-vertical-overflow');
        } else {
            // add 'vertical-overflow-scroll' to element with 'cell-content-wrapper' class
            $('#sidebar-dynamic').addClass('vertical-overflow-scroll');

            // remove 'submenu-vertical-overflow' from element with 'hidden-ul' class
            $('.hidden-ul').removeClass('submenu-vertical-overflow');
        }
    }

}
