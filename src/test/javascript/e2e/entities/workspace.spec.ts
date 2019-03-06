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

describe('Workspace e2e test', () => {

    let navBarPage: NavBarPage;
    let workspaceDialogPage: WorkspaceDialogPage;
    let workspaceComponentsPage: WorkspaceComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load Workspaces', () => {
        navBarPage.goToEntity('workspace');
        workspaceComponentsPage = new WorkspaceComponentsPage();
        expect(workspaceComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.workspace.home.title/);

    });

    it('should load create Workspace dialog', () => {
        workspaceComponentsPage.clickOnCreateButton();
        workspaceDialogPage = new WorkspaceDialogPage();
        expect(workspaceDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.workspace.home.createOrEditLabel/);
        workspaceDialogPage.close();
    });

    it('should create and save Workspaces', () => {
        workspaceComponentsPage.clickOnCreateButton();
        workspaceDialogPage.setNameInput('name');
        expect(workspaceDialogPage.getNameInput()).toMatch('name');
        workspaceDialogPage.setDescriptionInput('description');
        expect(workspaceDialogPage.getDescriptionInput()).toMatch('description');
        workspaceDialogPage.userSelectLastOption();
        workspaceDialogPage.save();
        expect(workspaceDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class WorkspaceComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-workspace div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class WorkspaceDialogPage {
    modalTitle = element(by.css('h4#myWorkspaceLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));
    descriptionInput = element(by.css('input#field_description'));
    userSelect = element(by.css('select#field_user'));

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

    userSelectLastOption = function () {
        this.userSelect.all(by.tagName('option')).last().click();
    }

    userSelectOption = function (option) {
        this.userSelect.sendKeys(option);
    }

    getUserSelect = function () {
        return this.userSelect;
    }

    getUserSelectedOption = function () {
        return this.userSelect.element(by.css('option:checked')).getText();
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
