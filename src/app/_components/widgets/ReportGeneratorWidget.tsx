"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {Box} from "@mui/material";
import ReportGeneratorView from "@/app/_components/reportgen/Report";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";

/** Hosts `ReportGeneratorView` inside a custom dashboard tile. */
export default function ReportGeneratorWidget(_props: WidgetProps) {
    return (
        <Box data-testid="report-generator-widget" sx={{height: '100%', overflowY: 'auto', minInlineSize: 0, p: 1}}>
            <ReportGeneratorView/>
        </Box>
    );
}
