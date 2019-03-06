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
export class SettingsNodeClass {

    public fieldLabel: string;
    public fieldWeight: string;
    public sizePolicy: string; // values = fixed | weight
    public labelFontFamily: string;
    public labelFontSize: string;
    public labelColor: string;
    public labelVPosition: string;
    public labelHPosition: string;
    public shapeWidth: string;
    public shapeHeight: string;
    public shapeColor: string;
    public borderWidth: number;
    public borderColor: string;
    public minZoomedFontSize: number;

    constructor() {
        this.fieldLabel = 'id';
        this.fieldWeight = '';
        this.sizePolicy = 'fixed';
        this.labelFontSize = '9px';
        this.labelColor = '#000000';
        this.labelVPosition = 'top';
        this.labelHPosition = 'center';
        this.shapeWidth = '30';
        this.shapeHeight = '30';
        this.shapeColor = '#d174c8';
        this.borderWidth = 1;
        this.borderColor = '#a0a0a0';
        this.minZoomedFontSize = 10;
    }
}
