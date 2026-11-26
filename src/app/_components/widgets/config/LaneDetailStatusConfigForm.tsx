"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import LaneSourceField from "./LaneSourceField";
import {LaneDetailStatusWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetConfigFormProps} from "@/app/_components/layout/WidgetTypes";

/** Shared lane-source selector for single-lane widgets (status, video, chart, spectrum). */
export default function LaneDetailStatusConfigForm({draft, onChange}: WidgetConfigFormProps) {
    const config = draft as LaneDetailStatusWidgetConfig & Record<string, unknown>;
    return (
        <LaneSourceField
            value={config.laneSource ?? {source: 'page'}}
            onChange={(laneSource) => onChange({...config, laneSource})}
        />
    );
}
