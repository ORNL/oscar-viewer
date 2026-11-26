"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useMemo} from "react";
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import {useSelector} from "react-redux";
import {randomUUID} from "osh-js/source/core/utils/Utils";
import {useAppDispatch} from "@/lib/state/Hooks";
import {
    buildDefaultWidgetConfig,
    WIDGET_INSTANCE_CAPS,
    WidgetInstance,
    WidgetType,
} from "@/lib/layout/PageConfigTypes";
import {addWidget, selectPageById} from "@/lib/state/PageLayoutSlice";
import {WIDGET_REGISTRY} from "./WidgetRegistry";
import {useLanguage} from "@/app/contexts/LanguageContext";

interface AddWidgetDialogProps {
    pageId: string;
    open: boolean;
    onClose: () => void;
}

/**
 * Palette of available widget types for a custom dashboard. Enforces per-page
 * instance caps (`video <= 4`, `chart <= 6`) with disabled buttons and tooltips.
 */
export default function AddWidgetDialog({pageId, open, onClose}: AddWidgetDialogProps) {
    const dispatch = useAppDispatch();
    const {t} = useLanguage();
    const page = useSelector(selectPageById(pageId));

    const countsByType = useMemo(() => {
        const map = new Map<WidgetType, number>();
        for (const w of page?.widgets ?? []) {
            map.set(w.type, (map.get(w.type) ?? 0) + 1);
        }
        return map;
    }, [page?.widgets]);

    const handleAdd = (type: WidgetType) => {
        const cap = WIDGET_INSTANCE_CAPS[type];
        if (cap !== undefined && (countsByType.get(type) ?? 0) >= cap) return;
        const widget: WidgetInstance = {
            id: `w-${randomUUID()}`,
            type,
            config: buildDefaultWidgetConfig(type),
        };
        dispatch(addWidget({pageId, widget}));
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('addWidget')}</DialogTitle>
            <DialogContent>
                <Grid container spacing={1.5} sx={{pt: 0.5}}>
                    {(Object.keys(WIDGET_REGISTRY) as WidgetType[]).map((type) => {
                        const entry = WIDGET_REGISTRY[type];
                        const cap = WIDGET_INSTANCE_CAPS[type];
                        const count = countsByType.get(type) ?? 0;
                        const atCap = cap !== undefined && count >= cap;
                        const widgetLabel = t(entry.titleKey);
                        const tooltipText = atCap
                            ? t('widgetCapReachedTooltip', {max: cap, widget: widgetLabel})
                            : '';

                        const card = (
                            <Card
                                variant="outlined"
                                sx={{
                                    height: '100%',
                                    opacity: atCap ? 0.58 : 1,
                                }}
                            >
                                <CardActionArea
                                    disabled={atCap}
                                    onClick={() => handleAdd(type)}
                                    sx={{height: '100%'}}
                                    data-testid={`add-widget-${type}`}
                                >
                                    <CardContent>
                                        <Stack alignItems="center" spacing={1}>
                                            {entry.icon}
                                            <Typography variant="body2" align="center">
                                                {widgetLabel}
                                            </Typography>
                                            {cap !== undefined && (
                                                <Chip
                                                    size="small"
                                                    color={atCap ? 'warning' : 'default'}
                                                    variant="outlined"
                                                    label={t('widgetCapReachedBadge', {count, max: cap})}
                                                    data-testid={`widget-cap-badge-${type}`}
                                                />
                                            )}
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        );

                        return (
                            <Grid item xs={6} sm={4} md={3} key={type}>
                                {atCap ? (
                                    <Tooltip title={tooltipText} arrow>
                                        <Box sx={{height: '100%'}} data-testid={`widget-cap-tooltip-${type}`}>
                                            {card}
                                        </Box>
                                    </Tooltip>
                                ) : (
                                    card
                                )}
                            </Grid>
                        );
                    })}
                </Grid>
            </DialogContent>
        </Dialog>
    );
}
