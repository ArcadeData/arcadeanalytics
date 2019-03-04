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
import { Directive, Input, AfterContentInit, ContentChildren, QueryList } from '@angular/core';
import { CKEditorComponent } from './ckeditor.component';
import { CKButtonDirective } from './ckbutton.directive';

/**
 * CKGroup component
 * Usage :
 *  <ckeditor [(ngModel)]="data" [config]="{...}" debounce="500">
 *      <ckgroup [name]="'exampleGroup2'" [previous]="'1'" [subgroupOf]="'exampleGroup1'">
 *          .
 *          .
 *      </ckgroup>
 *   </ckeditor>
 */
@Directive({
  selector: 'ckgroup',
})
export class CKGroupDirective implements AfterContentInit {
  @Input() name: string;
  @Input() previous: any;
  @Input() subgroupOf: string;
  @ContentChildren(CKButtonDirective) toolbarButtons: QueryList<CKButtonDirective>;

  ngAfterContentInit() {
    // Reconfigure each button's toolbar property within ckgroup to hold its parent's name
    this.toolbarButtons.forEach((button) => (button.toolbar = this.name));
  }

  public initialize(editor: CKEditorComponent) {
    editor.instance.ui.addToolbarGroup(this.name, this.previous, this.subgroupOf);
    // Initialize each button within ckgroup
    this.toolbarButtons.forEach((button) => {
      button.initialize(editor);
    });
  }
}
