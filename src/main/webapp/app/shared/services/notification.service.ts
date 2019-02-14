import { Injectable } from '@angular/core';

import PNotify from 'pnotify/dist/es/PNotifyCompat';
import PNotifyButtons from 'pnotify/dist/es/PNotifyButtons';

PNotify.defaults.styling = 'brighttheme';
PNotify.defaults.icons = 'brighttheme';

@Injectable({ providedIn: 'root' })
export class NotificationService {

    private warningOptions;
    private infoOptions;
    private successOptions;
    private errorOptions;

    constructor() {

        // tslint:disable-next-line:no-unused-expression
        PNotifyButtons; // Initiate the module. Important!

        this.warningOptions = {
            type: 'warning',
            delay: 5000,
            addclass: 'alert alert-warning alert-styled-right',
            text_escape: false,
            buttons: {
                closer: true,
                closer_hover: true,
                sticker: true,
                sticker_hover: true
            }
        };
        this.infoOptions = {
            type: 'info',
            delay: 5000,
            addclass: 'alert alert-info alert-styled-right',
            text_escape: false,
            buttons: {
                closer: true,
                closer_hover: true,
                sticker: true,
                sticker_hover: true
            }
        };
        this.successOptions = {
            type: 'success',
            delay: 2000,
            addclass: 'alert alert-success alert-styled-right',
            text_escape: false,
            buttons: {
                closer: true,
                closer_hover: true,
                sticker: true,
                sticker_hover: true          }
        };
        this.errorOptions = {
            type: 'error',
            delay: 5000,
            addclass: 'alert alert-danger alert-styled-right',
            text_escape: true,
            buttons: {
                closer: true,
                closer_hover: true,
                sticker: true,
                sticker_hover: true
            }
        };
    }

    push(type: string, title: string, text: string, timeout?: number, icon?: string|boolean) {

        let options: Object;

        switch (type) {
            case 'warning':
                options = this.warningOptions;
                break;
            case 'info':
                options = this.infoOptions;
                break;
            case 'success':
                options = this.successOptions;
                break;
            case 'error':
                options = this.errorOptions;
                break;
            default:
                options = this.infoOptions;
                break;
        }
        if (title) {
            options['title'] = title;
        }
        options['text'] = text;

        if (timeout) {
            options['delay'] = timeout;
        }

        if (icon) {
            options['icon'] = icon;
        }

        // notification showing
        const notification = new PNotify(options);

        // console logging
        if (type === 'error') {
            console.error(title + ': ' + text);
        } else {
            console.log(title + ': ' + text);
        }

        return notification;
    }

    updateNotification(notification, type: string, title: string, text: string, timeout?: number, icon?: string|boolean) {

        let options: Object;

        switch (type) {
            case 'warning':
                options = this.warningOptions;
                break;
            case 'info':
                options = this.infoOptions;
                break;
            case 'success':
                options = this.successOptions;
                break;
            case 'error':
                options = this.errorOptions;
                break;
            default:
                options = this.infoOptions;
                break;
        }
        options['title'] = title;
        options['text'] = text;

        if (timeout) {
            options['delay'] = timeout;
        }
        if (icon) {
            options['icon'] = icon;
        }

        this.updateNotificationFromOptions(notification, options);
    }

    updateNotificationFromOptions(notification, options) {
        notification.update(options);
    }

}
