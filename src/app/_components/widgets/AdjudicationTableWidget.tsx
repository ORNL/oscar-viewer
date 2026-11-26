"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {ConfigurableEventTable} from "./EventTableWidget";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";

export default function AdjudicationTableWidget(props: WidgetProps) {
    return <ConfigurableEventTable {...props} adjudicationMode/>;
}
