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

describe('DataSourceIndex e2e test', () => {

    let navBarPage: NavBarPage;
    let dataSourceIndexDialogPage: DataSourceIndexDialogPage;
    let dataSourceIndexComponentsPage: DataSourceIndexComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load DataSourceIndices', () => {
        navBarPage.goToEntity('data-source-index');
        dataSourceIndexComponentsPage = new DataSourceIndexComponentsPage();
        expect(dataSourceIndexComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.dataSourceIndex.home.title/);

    });

    it('should load create DataSourceIndex dialog', () => {
        dataSourceIndexComponentsPage.clickOnCreateButton();
        dataSourceIndexDialogPage = new DataSourceIndexDialogPage();
        expect(dataSourceIndexDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.dataSourceIndex.home.createOrEditLabel/);
        dataSourceIndexDialogPage.close();
    });

    it('should create and save DataSourceIndices', () => {
        dataSourceIndexComponentsPage.clickOnCreateButton();
        dataSourceIndexDialogPage.setStartedAtInput('2000-12-31');
        expect(dataSourceIndexDialogPage.getStartedAtInput()).toMatch('2000-12-31');
        dataSourceIndexDialogPage.setEndedAtInput('2000-12-31');
        expect(dataSourceIndexDialogPage.getEndedAtInput()).toMatch('2000-12-31');
        dataSourceIndexDialogPage.setDocumentsInput('5');
        expect(dataSourceIndexDialogPage.getDocumentsInput()).toMatch('5');
        dataSourceIndexDialogPage.getStatusInput().isSelected().then(function (selected) {
            if (selected) {
                dataSourceIndexDialogPage.getStatusInput().click();
                expect(dataSourceIndexDialogPage.getStatusInput().isSelected()).toBeFalsy();
            } else {
                dataSourceIndexDialogPage.getStatusInput().click();
                expect(dataSourceIndexDialogPage.getStatusInput().isSelected()).toBeTruthy();
            }
        });
        dataSourceIndexDialogPage.setReportInput('report');
        expect(dataSourceIndexDialogPage.getReportInput()).toMatch('report');
        dataSourceIndexDialogPage.dataSourceSelectLastOption();
        dataSourceIndexDialogPage.save();
        expect(dataSourceIndexDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class DataSourceIndexComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-data-source-index div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class DataSourceIndexDialogPage {
    modalTitle = element(by.css('h4#myDataSourceIndexLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    startedAtInput = element(by.css('input#field_startedAt'));
    endedAtInput = element(by.css('input#field_endedAt'));
    documentsInput = element(by.css('input#field_documents'));
    statusInput = element(by.css('input#field_status'));
    reportInput = element(by.css('input#field_report'));
    dataSourceSelect = element(by.css('select#field_dataSource'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    setStartedAtInput = function (startedAt) {
        this.startedAtInput.sendKeys(startedAt);
    }

    getStartedAtInput = function () {
        return this.startedAtInput.getAttribute('value');
    }

    setEndedAtInput = function (endedAt) {
        this.endedAtInput.sendKeys(endedAt);
    }

    getEndedAtInput = function () {
        return this.endedAtInput.getAttribute('value');
    }

    setDocumentsInput = function (documents) {
        this.documentsInput.sendKeys(documents);
    }

    getDocumentsInput = function () {
        return this.documentsInput.getAttribute('value');
    }

    getStatusInput = function () {
        return this.statusInput;
    }
    setReportInput = function (report) {
        this.reportInput.sendKeys(report);
    }

    getReportInput = function () {
        return this.reportInput.getAttribute('value');
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
