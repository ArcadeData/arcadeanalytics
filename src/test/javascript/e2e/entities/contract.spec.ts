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

describe('Contract e2e test', () => {

    let navBarPage: NavBarPage;
    let contractDialogPage: ContractDialogPage;
    let contractComponentsPage: ContractComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load Contracts', () => {
        navBarPage.goToEntity('contract');
        contractComponentsPage = new ContractComponentsPage();
        expect(contractComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.contract.home.title/);

    });

    it('should load create Contract dialog', () => {
        contractComponentsPage.clickOnCreateButton();
        contractDialogPage = new ContractDialogPage();
        expect(contractDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.contract.home.createOrEditLabel/);
        contractDialogPage.close();
    });

    it('should create and save Contracts', () => {
        contractComponentsPage.clickOnCreateButton();
        contractDialogPage.setNameInput('name');
        expect(contractDialogPage.getNameInput()).toMatch('name');
        contractDialogPage.setDescriptionInput('description');
        expect(contractDialogPage.getDescriptionInput()).toMatch('description');
        contractDialogPage.typeSelectLastOption();
        contractDialogPage.setMaxWorkspacesInput('5');
        expect(contractDialogPage.getMaxWorkspacesInput()).toMatch('5');
        contractDialogPage.setMaxDashboardsInput('5');
        expect(contractDialogPage.getMaxDashboardsInput()).toMatch('5');
        contractDialogPage.setMaxWidgetsInput('5');
        expect(contractDialogPage.getMaxWidgetsInput()).toMatch('5');
        contractDialogPage.setMaxElementsInput('5');
        expect(contractDialogPage.getMaxElementsInput()).toMatch('5');
        contractDialogPage.setMaxTraversalInput('5');
        expect(contractDialogPage.getMaxTraversalInput()).toMatch('5');
        contractDialogPage.setMaxPowerInput('5');
        expect(contractDialogPage.getMaxPowerInput()).toMatch('5');
        contractDialogPage.getHaInput().isSelected().then(function (selected) {
            if (selected) {
                contractDialogPage.getHaInput().click();
                expect(contractDialogPage.getHaInput().isSelected()).toBeFalsy();
            } else {
                contractDialogPage.getHaInput().click();
                expect(contractDialogPage.getHaInput().isSelected()).toBeTruthy();
            }
        });
        contractDialogPage.setPollingIntervalInput('5');
        expect(contractDialogPage.getPollingIntervalInput()).toMatch('5');
        contractDialogPage.save();
        expect(contractDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class ContractComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-contract div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class ContractDialogPage {
    modalTitle = element(by.css('h4#myContractLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));
    descriptionInput = element(by.css('input#field_description'));
    typeSelect = element(by.css('select#field_type'));
    maxWorkspacesInput = element(by.css('input#field_maxWorkspaces'));
    maxDashboardsInput = element(by.css('input#field_maxDashboards'));
    maxWidgetsInput = element(by.css('input#field_maxWidgets'));
    maxElementsInput = element(by.css('input#field_maxElements'));
    maxTraversalInput = element(by.css('input#field_maxTraversal'));
    maxPowerInput = element(by.css('input#field_maxPower'));
    haInput = element(by.css('input#field_ha'));
    pollingIntervalInput = element(by.css('input#field_pollingInterval'));

    getModalTitle() {
        return this.modalTitle.getAttribute('jhiTranslate');
    }

    setNameInput = function (name) {
        this.nameInput.sendKeys(name);
    }

    getNameInput = function () {
        return this.nameInput.getAttribute('value');
    }

    setDescriptionInput = function (description) {
        this.descriptionInput.sendKeys(description);
    }

    getDescriptionInput = function () {
        return this.descriptionInput.getAttribute('value');
    }

    setTypeSelect = function (type) {
        this.typeSelect.sendKeys(type);
    }

    getTypeSelect = function () {
        return this.typeSelect.element(by.css('option:checked')).getText();
    }

    typeSelectLastOption = function () {
        this.typeSelect.all(by.tagName('option')).last().click();
    }
    setMaxWorkspacesInput = function (maxWorkspaces) {
        this.maxWorkspacesInput.sendKeys(maxWorkspaces);
    }

    getMaxWorkspacesInput = function () {
        return this.maxWorkspacesInput.getAttribute('value');
    }

    setMaxDashboardsInput = function (maxDashboards) {
        this.maxDashboardsInput.sendKeys(maxDashboards);
    }

    getMaxDashboardsInput = function () {
        return this.maxDashboardsInput.getAttribute('value');
    }

    setMaxWidgetsInput = function (maxWidgets) {
        this.maxWidgetsInput.sendKeys(maxWidgets);
    }

    getMaxWidgetsInput = function () {
        return this.maxWidgetsInput.getAttribute('value');
    }

    setMaxElementsInput = function (maxElements) {
        this.maxElementsInput.sendKeys(maxElements);
    }

    getMaxElementsInput = function () {
        return this.maxElementsInput.getAttribute('value');
    }

    setMaxTraversalInput = function (maxTraversal) {
        this.maxTraversalInput.sendKeys(maxTraversal);
    }

    getMaxTraversalInput = function () {
        return this.maxTraversalInput.getAttribute('value');
    }

    setMaxPowerInput = function (maxPower) {
        this.maxPowerInput.sendKeys(maxPower);
    }

    getMaxPowerInput = function () {
        return this.maxPowerInput.getAttribute('value');
    }

    getHaInput = function () {
        return this.haInput;
    }
    setPollingIntervalInput = function (pollingInterval) {
        this.pollingIntervalInput.sendKeys(pollingInterval);
    }

    getPollingIntervalInput = function () {
        return this.pollingIntervalInput.getAttribute('value');
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
