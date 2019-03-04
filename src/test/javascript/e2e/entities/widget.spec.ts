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
import { browser, element, by, $ } from 'protractor';
import { NavBarPage } from './../page-objects/jhi-page-objects';
const path = require('path');

describe('Widget e2e test', () => {

    let navBarPage: NavBarPage;
    let widgetDialogPage: WidgetDialogPage;
    let widgetComponentsPage: WidgetComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load Widgets', () => {
        navBarPage.goToEntity('widget');
        widgetComponentsPage = new WidgetComponentsPage();
        expect(widgetComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.widget.home.title/);

    });

    it('should load create Widget dialog', () => {
        widgetComponentsPage.clickOnCreateButton();
        widgetDialogPage = new WidgetDialogPage();
        expect(widgetDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.widget.home.createOrEditLabel/);
        widgetDialogPage.close();
    });

    it('should create and save Widgets', () => {
        widgetComponentsPage.clickOnCreateButton();
        widgetDialogPage.setNameInput('name');
        expect(widgetDialogPage.getNameInput()).toMatch('name');
        widgetDialogPage.setTypeInput('type');
        expect(widgetDialogPage.getTypeInput()).toMatch('type');
        widgetDialogPage.getHasSnapshotInput().isSelected().then(function (selected) {
            if (selected) {
                widgetDialogPage.getHasSnapshotInput().click();
                expect(widgetDialogPage.getHasSnapshotInput().isSelected()).toBeFalsy();
            } else {
                widgetDialogPage.getHasSnapshotInput().click();
                expect(widgetDialogPage.getHasSnapshotInput().isSelected()).toBeTruthy();
            }
        });
        widgetDialogPage.dataSetSelectLastOption();
        widgetDialogPage.dataSourceSelectLastOption();
        widgetDialogPage.dashboardSelectLastOption();
        widgetDialogPage.save();
        expect(widgetDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class WidgetComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-widget div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class WidgetDialogPage {
    modalTitle = element(by.css('h4#myWidgetLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));
    typeInput = element(by.css('input#field_type'));
    hasSnapshotInput = element(by.css('input#field_hasSnapshot'));
    dataSetSelect = element(by.css('select#field_dataSet'));
    dataSourceSelect = element(by.css('select#field_dataSource'));
    dashboardSelect = element(by.css('select#field_dashboard'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    setNameInput = function (name) {
        this.nameInput.sendKeys(name);
    }

    getNameInput = function () {
        return this.nameInput.getAttribute('value');
    }

    setTypeInput = function (type) {
        this.typeInput.sendKeys(type);
    }

    getTypeInput = function () {
        return this.typeInput.getAttribute('value');
    }

    getHasSnapshotInput = function () {
        return this.hasSnapshotInput;
    }
    dataSetSelectLastOption = function () {
        this.dataSetSelect.all(by.tagName('option')).last().click();
    }

    dataSetSelectOption = function (option) {
        this.dataSetSelect.sendKeys(option);
    }

    getDataSetSelect = function () {
        return this.dataSetSelect;
    }

    getDataSetSelectedOption = function () {
        return this.dataSetSelect.element(by.css('option:checked')).getText();
    }

    dataSourceSelectLastOption = function () {
        this.dataSourceSelect.all(by.tagName('option')).last().click();
    }

    dataSourceSelectOption = function (option) {
        this.dataSourceSelect.sendKeys(option);
    }

    getDataSourceSelect = function () {
        return this.dataSourceSelect;
    }

    getDataSourceSelectedOption = function () {
        return this.dataSourceSelect.element(by.css('option:checked')).getText();
    }

    dashboardSelectLastOption = function () {
        this.dashboardSelect.all(by.tagName('option')).last().click();
    }

    dashboardSelectOption = function (option) {
        this.dashboardSelect.sendKeys(option);
    }

    getDashboardSelect = function () {
        return this.dashboardSelect;
    }

    getDashboardSelectedOption = function () {
        return this.dashboardSelect.element(by.css('option:checked')).getText();
    }

    save() {
        this.saveButton.click();
    }

    close() {
        this.closeButton.click();
    }

    getSaveButton() {
        return this.saveButton;
    }
}
