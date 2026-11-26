"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {Box} from "@mui/material";
import AlarmTransferImport from "@/app/_components/alarm-transfer/AlarmTransferImport";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";

/** Hosts `AlarmTransferImport` (camera/image QR scan, alarm file, pasted payload) inside a widget tile. */
export default function AlarmTransferWidget(_props: WidgetProps) {
    return (
        <Box data-testid="alarm-transfer-widget" sx={{height: '100%', overflowY: 'auto', minInlineSize: 0, p: 2}}>
            <AlarmTransferImport/>
        </Box>
    );
}
