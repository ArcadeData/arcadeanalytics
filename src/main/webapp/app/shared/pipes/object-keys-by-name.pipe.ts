import {Pipe, PipeTransform} from '@angular/core';
@Pipe({
    name: 'objectKeysByName',
    pure: true
})
export class KeysByNamePipe implements PipeTransform {
    transform(value): any {
        const keys = [];
        if (value) {
            for (const key of Object.keys(value)) {
                keys.push(key);
            }
        }
        keys.sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        return keys;
    }
}
