import {Pipe, PipeTransform} from '@angular/core';
@Pipe({
    name: 'objectKeys',
    pure: false })
export class KeysPipe implements PipeTransform {
    transform(value): any {
        const keys = [];
        if (value) {
            for (const key of Object.keys(value)) {
                keys.push(key);
            }
        }
        return keys;
    }
}
