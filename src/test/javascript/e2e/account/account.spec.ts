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
import { browser, element, by } from 'protractor';
import { NavBarPage, SignInPage, PasswordPage, SettingsPage} from './../page-objects/jhi-page-objects';

describe('account', () => {

    let navBarPage: NavBarPage;
    let signInPage: SignInPage;
    let passwordPage: PasswordPage;
    let settingsPage: SettingsPage;

    beforeAll(() => {
        browser.get('/');
        browser.waitForAngular();
        navBarPage = new NavBarPage(true);
        browser.waitForAngular();
    });

    it('should fail to login with bad password', () => {
        const expect1 = /home.title/;
        element.all(by.css('h1')).first().getAttribute('jhiTranslate').then((value) => {
            expect(value).toMatch(expect1);
        });
        signInPage = navBarPage.getSignInPage();
        signInPage.autoSignInUsing('admin', 'foo');

        const expect2 = /login.messages.error.authentication/;
        element.all(by.css('.alert-danger')).first().getAttribute('jhiTranslate').then((value) => {
            expect(value).toMatch(expect2);
        });
    });

    it('should login successfully with admin account', () => {
        const expect1 = /global.form.username/;
        element.all(by.css('.modal-content label')).first().getAttribute('jhiTranslate').then((value) => {
            expect(value).toMatch(expect1);
        });
        signInPage.clearUserName();
        signInPage.setUserName('admin');
        signInPage.clearPassword();
        signInPage.setPassword('admin');
        signInPage.login();

        browser.waitForAngular();

        const expect2 = /home.logged.message/;
        element.all(by.css('.alert-success span')).getAttribute('jhiTranslate').then((value) => {
            expect(value).toMatch(expect2);
        });
    });
    it('should be able to update settings', () => {
        settingsPage = navBarPage.getSettingsPage();

        const expect1 = /settings.title/;
        settingsPage.getTitle().then((value) => {
            expect(value).toMatch(expect1);
        });
        settingsPage.save();

        const expect2 = /settings.messages.success/;
        element.all(by.css('.alert-success')).first().getAttribute('jhiTranslate').then((value) => {
            expect(value).toMatch(expect2);
        });
    });

    it('should be able to update password', () => {
        passwordPage = navBarPage.getPasswordPage();

        expect(passwordPage.getTitle()).toMatch(/password.title/);

        passwordPage.setPassword('newpassword');
        passwordPage.setConfirmPassword('newpassword');
        passwordPage.save();

        const expect2 = /password.messages.success/;
        element.all(by.css('.alert-success')).first().getAttribute('jhiTranslate').then((value) => {
            expect(value).toMatch(expect2);
        });
        navBarPage.autoSignOut();
        navBarPage.goToSignInPage();
        signInPage.autoSignInUsing('admin', 'newpassword');

        // change back to default
        navBarPage.goToPasswordMenu();
        passwordPage.setPassword('admin');
        passwordPage.setConfirmPassword('admin');
        passwordPage.save();
    });

    afterAll(() => {
        navBarPage.autoSignOut();
    });
});
