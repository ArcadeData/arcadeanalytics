import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Base64Service {

    constructor() {}

    /**
     * Converts a base64 string in a Blob according to the data and contentType.
     *
     * @param b64Data {String} Pure base64 string without contentType
     * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
     * @param sliceSize {Int} SliceSize to process the byteCharacters
     * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
     * @return Blob
     */
    b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        if (b64Data.indexOf(contentType)) {
            // b64Data example structure: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkYAAA.....";

            // Split the base64 string in data and contentType
            const block: string[] = b64Data.split(';');

            // get the real base64 content of the file
            b64Data = block[1].split(',')[1];
        }

        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }
}
