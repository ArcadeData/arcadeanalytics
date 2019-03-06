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

describe('Company e2e test', () => {

    let navBarPage: NavBarPage;
    let companyDialogPage: CompanyDialogPage;
    let companyComponentsPage: CompanyComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load Companies', () => {
        navBarPage.goToEntity('company');
        companyComponentsPage = new CompanyComponentsPage();
        expect(companyComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.company.home.title/);

    });

    it('should load create Company dialog', () => {
        companyComponentsPage.clickOnCreateButton();
        companyDialogPage = new CompanyDialogPage();
        expect(companyDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.company.home.createOrEditLabel/);
        companyDialogPage.close();
    });

    it('should create and save Companies', () => {
        companyComponentsPage.clickOnCreateButton();
        companyDialogPage.setNameInput('name');
        expect(companyDialogPage.getNameInput()).toMatch('name');
        companyDialogPage.setDescriptionInput('description');
        expect(companyDialogPage.getDescriptionInput()).toMatch('description');
        companyDialogPage.contractSelectLastOption();
        companyDialogPage.save();
        expect(companyDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class CompanyComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-company div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class CompanyDialogPage {
    modalTitle = element(by.css('h4#myCompanyLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));
    descriptionInput = element(by.css('input#field_description'));
    contractSelect = element(by.css('select#field_contract'));

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

    contractSelectLastOption = function () {
        this.contractSelect.all(by.tagName('option')).last().click();
    }

    contractSelectOption = function (option) {
        this.contractSelect.sendKeys(option);
    }

    getContractSelect = function () {
        return this.contractSelect;
    }

    getContractSelectedOption = function () {
        return this.contractSelect.element(by.css('option:checked')).getText();
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
