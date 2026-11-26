"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {Box, Typography} from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

interface Props {
    children: React.ReactNode;
    widgetName?: string;
}

interface State {
    hasError: boolean;
}

/** Isolates widget render errors so one failing tile cannot crash the dashboard. */
export default class WidgetErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(): State {
        return {hasError: true};
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`Widget "${this.props.widgetName ?? 'unknown'}" crashed:`, error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100%', gap: 1, p: 2,
                }}>
                    <ErrorOutlineRoundedIcon color="error"/>
                    <Typography variant="body2" color="text.secondary" align="center">
                        {this.props.widgetName ?? 'Widget'} failed to render
                    </Typography>
                </Box>
            );
        }
        return this.props.children;
    }
}
