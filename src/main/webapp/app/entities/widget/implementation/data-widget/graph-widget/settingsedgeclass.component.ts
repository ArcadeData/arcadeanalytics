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
export class SettingsEdgeClass {

    public fieldLabel: string;
    public fieldWeight: string;
    public sizePolicy: string; // values = fixed | weight
    public labelFontFamily: string;
    public labelFontSize: string;
    public labelColor: string;
    public textMarginY: number;
    public minZoomedFontSize: number;
    public edgeDistances: string;
    public opacity: number;
    public sourceArrowColor: string;
    public sourceArrowShape: string;
    public targetArrowColor: string;
    public targetArrowShape: string;
    public lineWidth: string;
    public lineStyle: string;
    public lineColor: string;

    constructor() {
        this.fieldLabel = '';
        this.fieldWeight = '';
        this.sizePolicy = 'fixed';
        this.labelFontSize = '9px';
        this.labelColor = '#000000';
        this.textMarginY = 12;
        this.minZoomedFontSize = 10;
        this.edgeDistances = 'node-position';
        this.opacity = 1.0;
        this.sourceArrowColor = '#ffffff';
        this.sourceArrowShape = 'none';
        this.targetArrowColor = '#e1eaea';
        this.targetArrowShape = 'triangle';
        this.lineStyle = 'solid';
        this.lineColor = '#e1eaea';
        this.lineWidth = '1';
    }
}
