import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'objectKeysByCount',
    pure: true
})
export class KeysByCountPipe implements PipeTransform {
    transform(value, classesInfo): any {
        const keys = [];
        if (value) {
            for (const key of Object.keys(value)) {
                keys.push(key);
            }

            keys.sort((a, b) => {
                return classesInfo.get(b)['count'] - classesInfo.get(a)['count'];
            });
        }
        return keys;
    }
}
