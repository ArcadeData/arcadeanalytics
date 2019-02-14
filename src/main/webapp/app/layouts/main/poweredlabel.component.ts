import { Component, OnInit, Input } from '@angular/core';
import { pageContentPadding } from 'app/global';

@Component({
    selector: 'powered-by-label',
    templateUrl: './poweredlabel.component.html',
    styleUrls: ['./poweredlabel.component.scss']
})
export class PoweredLabelComponent {

    @Input() top: boolean = this.top ? this.top : false;
    @Input() bottom: boolean = this.bottom ? this.bottom : true;
    padding: number = pageContentPadding;

    constructor() {}

}
