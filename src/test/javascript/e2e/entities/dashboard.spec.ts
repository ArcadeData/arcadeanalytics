import { browser, element, by, $ } from 'protractor';
import { NavBarPage } from './../page-objects/jhi-page-objects';
const path = require('path');

describe('Dashboard e2e test', () => {

    let navBarPage: NavBarPage;
    let dashboardDialogPage: DashboardDialogPage;
    let dashboardComponentsPage: DashboardComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load Dashboards', () => {
        navBarPage.goToEntity('dashboard');
        dashboardComponentsPage = new DashboardComponentsPage();
        expect(dashboardComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.dashboard.home.title/);

    });

    it('should load create Dashboard dialog', () => {
        dashboardComponentsPage.clickOnCreateButton();
        dashboardDialogPage = new DashboardDialogPage();
        expect(dashboardDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.dashboard.home.createOrEditLabel/);
        dashboardDialogPage.close();
    });

    it('should create and save Dashboards', () => {
        dashboardComponentsPage.clickOnCreateButton();
        dashboardDialogPage.setNameInput('name');
        expect(dashboardDialogPage.getNameInput()).toMatch('name');
        dashboardDialogPage.setDescriptionInput('description');
        expect(dashboardDialogPage.getDescriptionInput()).toMatch('description');
        dashboardDialogPage.setLayoutInput('layout');
        expect(dashboardDialogPage.getLayoutInput()).toMatch('layout');
        dashboardDialogPage.workspaceSelectLastOption();
        dashboardDialogPage.save();
        expect(dashboardDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class DashboardComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-dashboard div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class DashboardDialogPage {
    modalTitle = element(by.css('h4#myDashboardLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));
    descriptionInput = element(by.css('input#field_description'));
    layoutInput = element(by.css('textarea#field_layout'));
    workspaceSelect = element(by.css('select#field_workspace'));

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

    setLayoutInput = function (layout) {
        this.layoutInput.sendKeys(layout);
    }

    getLayoutInput = function () {
        return this.layoutInput.getAttribute('value');
    }

    workspaceSelectLastOption = function () {
        this.workspaceSelect.all(by.tagName('option')).last().click();
    }

    workspaceSelectOption = function (option) {
        this.workspaceSelect.sendKeys(option);
    }

    getWorkspaceSelect = function () {
        return this.workspaceSelect;
    }

    getWorkspaceSelectedOption = function () {
        return this.workspaceSelect.element(by.css('option:checked')).getText();
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
