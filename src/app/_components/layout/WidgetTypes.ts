/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as React from "react";
import {PageConfig, WidgetConfig, WidgetInstance} from "@/lib/layout/PageConfigTypes";

/** Contract implemented by every widget component in `WIDGET_REGISTRY`. */
export interface WidgetProps {
    page: PageConfig;
    widget: WidgetInstance;
}

/** Contract implemented by per-widget config forms hosted in `WidgetConfigDialog`. */
export interface WidgetConfigFormProps {
    page: PageConfig;
    widget: WidgetInstance;
    draft: WidgetConfig;
    onChange: (next: WidgetConfig) => void;
}

export type WidgetComponent = React.ComponentType<WidgetProps>;
export type WidgetConfigFormComponent = React.ComponentType<WidgetConfigFormProps>;
