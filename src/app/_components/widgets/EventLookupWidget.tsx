"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {Box} from "@mui/material";
import EventUuidLookup from "@/app/_components/event-table/EventUuidLookup";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";

/** Hosts `EventUuidLookup` inside a custom dashboard tile. */
export default function EventLookupWidget(_props: WidgetProps) {
    return (
        <Box data-testid="event-lookup-widget" sx={{
            height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', p: 1.5,
            '& > .MuiStack-root': {width: '100%'},
            '& .MuiTextField-root': {minWidth: 0, flex: 1},
        }}>
            <EventUuidLookup/>
        </Box>
    );
}
