import { browser, element, by, $ } from 'protractor';
import { NavBarPage } from './../page-objects/jhi-page-objects';
const path = require('path');

describe('DataSource e2e test', () => {

    let navBarPage: NavBarPage;
    let dataSourceDialogPage: DataSourceDialogPage;
    let dataSourceComponentsPage: DataSourceComponentsPage;
    const fileToUpload = '../../../../main/webapp/content/images/logo-jhipster.png';
    const absolutePath = path.resolve(__dirname, fileToUpload);
    

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage();
        navBarPage.getSignInPage().autoSignInUsing('admin', 'admin');
        browser.waitForAngular();
    });

    it('should load DataSources', () => {
        navBarPage.goToEntity('data-source');
        dataSourceComponentsPage = new DataSourceComponentsPage();
        expect(dataSourceComponentsPage.getTitle()).toMatch(/arcadeanalyticsApp.dataSource.home.title/);

    });

    it('should load create DataSource dialog', () => {
        dataSourceComponentsPage.clickOnCreateButton();
        dataSourceDialogPage = new DataSourceDialogPage();
        expect(dataSourceDialogPage.getModalTitle()).toMatch(/arcadeanalyticsApp.dataSource.home.createOrEditLabel/);
        dataSourceDialogPage.close();
    });

    it('should create and save DataSources', () => {
        dataSourceComponentsPage.clickOnCreateButton();
        dataSourceDialogPage.setNameInput('name');
        expect(dataSourceDialogPage.getNameInput()).toMatch('name');
        dataSourceDialogPage.setDescriptionInput('description');
        expect(dataSourceDialogPage.getDescriptionInput()).toMatch('description');
        dataSourceDialogPage.typeSelectLastOption();
        dataSourceDialogPage.indexingSelectLastOption();
        dataSourceDialogPage.setServerInput('server');
        expect(dataSourceDialogPage.getServerInput()).toMatch('server');
        dataSourceDialogPage.setPortInput('5');
        expect(dataSourceDialogPage.getPortInput()).toMatch('5');
        dataSourceDialogPage.setDatabaseInput('database');
        expect(dataSourceDialogPage.getDatabaseInput()).toMatch('database');
        dataSourceDialogPage.setUsernameInput('username');
        expect(dataSourceDialogPage.getUsernameInput()).toMatch('username');
        dataSourceDialogPage.setPasswordInput('password');
        expect(dataSourceDialogPage.getPasswordInput()).toMatch('password');
        dataSourceDialogPage.getRemoteInput().isSelected().then(function (selected) {
            if (selected) {
                dataSourceDialogPage.getRemoteInput().click();
                expect(dataSourceDialogPage.getRemoteInput().isSelected()).toBeFalsy();
            } else {
                dataSourceDialogPage.getRemoteInput().click();
                expect(dataSourceDialogPage.getRemoteInput().isSelected()).toBeTruthy();
            }
        });
        dataSourceDialogPage.setGatewayInput('gateway');
        expect(dataSourceDialogPage.getGatewayInput()).toMatch('gateway');
        dataSourceDialogPage.setSshPortInput('5');
        expect(dataSourceDialogPage.getSshPortInput()).toMatch('5');
        dataSourceDialogPage.workspaceSelectLastOption();
        dataSourceDialogPage.save();
        expect(dataSourceDialogPage.getSaveButton().isPresent()).toBeFalsy();
    }); 

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});

export class DataSourceComponentsPage {
    createButton = element(by.css('.jh-create-entity'));
    title = element.all(by.css('jhi-data-source div h2 span')).first();

    clickOnCreateButton() {
        return this.createButton.click();
    }

    getTitle() {
        return this.title.getAttribute('jhiTranslate');
    }
}

export class DataSourceDialogPage {
    modalTitle = element(by.css('h4#myDataSourceLabel'));
    saveButton = element(by.css('.modal-footer .btn.btn-primary'));
    closeButton = element(by.css('button.close'));
    nameInput = element(by.css('input#field_name'));
    descriptionInput = element(by.css('input#field_description'));
    typeSelect = element(by.css('select#field_type'));
    indexingSelect = element(by.css('select#field_indexing'));
    serverInput = element(by.css('input#field_server'));
    portInput = element(by.css('input#field_port'));
    databaseInput = element(by.css('input#field_database'));
    usernameInput = element(by.css('input#field_username'));
    passwordInput = element(by.css('input#field_password'));
    remoteInput = element(by.css('input#field_remote'));
    gatewayInput = element(by.css('input#field_gateway'));
    sshPortInput = element(by.css('input#field_sshPort'));
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

    setTypeSelect = function (type) {
        this.typeSelect.sendKeys(type);
    }

    getTypeSelect = function () {
        return this.typeSelect.element(by.css('option:checked')).getText();
    }

    typeSelectLastOption = function () {
        this.typeSelect.all(by.tagName('option')).last().click();
    }
    setIndexingSelect = function (indexing) {
        this.indexingSelect.sendKeys(indexing);
    }

    getIndexingSelect = function () {
        return this.indexingSelect.element(by.css('option:checked')).getText();
    }

    indexingSelectLastOption = function () {
        this.indexingSelect.all(by.tagName('option')).last().click();
    }
    setServerInput = function (server) {
        this.serverInput.sendKeys(server);
    }

    getServerInput = function () {
        return this.serverInput.getAttribute('value');
    }

    setPortInput = function (port) {
        this.portInput.sendKeys(port);
    }

    getPortInput = function () {
        return this.portInput.getAttribute('value');
    }

    setDatabaseInput = function (database) {
        this.databaseInput.sendKeys(database);
    }

    getDatabaseInput = function () {
        return this.databaseInput.getAttribute('value');
    }

    setUsernameInput = function (username) {
        this.usernameInput.sendKeys(username);
    }

    getUsernameInput = function () {
        return this.usernameInput.getAttribute('value');
    }

    setPasswordInput = function (password) {
        this.passwordInput.sendKeys(password);
    }

    getPasswordInput = function () {
        return this.passwordInput.getAttribute('value');
    }

    getRemoteInput = function () {
        return this.remoteInput;
    }
    setGatewayInput = function (gateway) {
        this.gatewayInput.sendKeys(gateway);
    }

    getGatewayInput = function () {
        return this.gatewayInput.getAttribute('value');
    }

    setSshPortInput = function (sshPort) {
        this.sshPortInput.sendKeys(sshPort);
    }

    getSshPortInput = function () {
        return this.sshPortInput.getAttribute('value');
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
