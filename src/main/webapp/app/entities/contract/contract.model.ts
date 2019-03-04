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
import { BaseEntity } from './../../shared';

export const enum ContractType {
    'FREE',
    'SILVER',
    'GOLD',
    'CUSTOM'
}

export class Contract implements BaseEntity {
    constructor(
        public id?: number,
        public name?: string,
        public description?: string,
        public type?: ContractType,
        public maxWorkspaces?: number,
        public maxDashboards?: number,
        public maxWidgets?: number,
        public maxElements?: number,
        public maxTraversal?: number,
        public maxPower?: number,
        public ha?: boolean,
        public pollingInterval?: number,
    ) {
        this.ha = false;
    }
}
