"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import LaneSelectionField from "./LaneSelectionField";
import {SystemStatusWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetConfigFormProps} from "@/app/_components/layout/WidgetTypes";

export default function SystemStatusConfigForm({draft, onChange}: WidgetConfigFormProps) {
    const config = draft as SystemStatusWidgetConfig & Record<string, unknown>;
    return (
        <LaneSelectionField
            value={config.lanes ?? {mode: 'all'}}
            onChange={(lanes) => onChange({...config, lanes})}
        />
    );
}
