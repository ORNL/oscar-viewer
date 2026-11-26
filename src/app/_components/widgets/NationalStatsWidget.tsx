"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {Box} from "@mui/material";
import NationalViewPage from "@/app/national-view/page";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";

/** Hosts the National Statistics view inside a custom dashboard tile. */
export default function NationalStatsWidget(_props: WidgetProps) {
    return (
        <Box sx={{height: '100%', overflowY: 'auto'}}>
            <NationalViewPage/>
        </Box>
    );
}
