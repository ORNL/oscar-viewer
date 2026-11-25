"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {Box} from "@mui/material";
import HealthPage from "@/app/health/page";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";

/** Hosts the State of Health view inside a custom dashboard tile. */
export default function StateOfHealthWidget(_props: WidgetProps) {
    return (
        <Box
            data-testid="state-of-health-widget"
            sx={{
                height: '100%',
                overflowY: 'auto',
                minInlineSize: 0,
                p: 1,
                '& h1': {display: 'none'},
                '& svg[data-testid="MonitorHeartRoundedIcon"]': {display: 'none'},
            }}
        >
            <HealthPage/>
        </Box>
    );
}
