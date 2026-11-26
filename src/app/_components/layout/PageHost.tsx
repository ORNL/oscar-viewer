"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useEffect, useMemo, useState} from "react";
import ReactGridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {Box, Button, Paper, Stack, Typography} from "@mui/material";
import Link from "next/link";
import {useSelector} from "react-redux";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {useAppDispatch} from "@/lib/state/Hooks";
import {
    LayoutItem,
    PageConfig,
    RGL_BREAKPOINTS,
    RGL_COLS,
    RGL_ROW_HEIGHT,
    RGLBreakpoint,
    WIDGET_SIZES,
    WidgetInstance,
} from "@/lib/layout/PageConfigTypes";
import {
    removeWidget,
    selectEditModePageId,
    selectPageById,
    updateLayouts,
} from "@/lib/state/PageLayoutSlice";
import {WIDGET_REGISTRY} from "./WidgetRegistry";
import WidgetFrame from "./WidgetFrame";
import WidgetErrorBoundary from "./WidgetErrorBoundary";
import WidgetConfigDialog from "./WidgetConfigDialog";
import {useLanguage} from "@/app/contexts/LanguageContext";

const ResponsiveGridLayout = ReactGridLayout.WidthProvider(ReactGridLayout.Responsive);

interface PageHostProps {
    pageId: string;
}

/** Renders one configurable dashboard page on a responsive 12-column grid. */
export default function PageHost({pageId}: PageHostProps) {
    const dispatch = useAppDispatch();
    const {t} = useLanguage();
    const {scopedHref} = useContext(DataSourceContext);
    const page: PageConfig | undefined = useSelector(selectPageById(pageId));
    const editModePageId = useSelector(selectEditModePageId);
    const editMode = editModePageId === pageId;

    const [configWidgetId, setConfigWidgetId] = useState<string | null>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const widgetTypeById = useMemo(() => {
        const map = new Map<string, WidgetInstance['type']>();
        page?.widgets.forEach((w) => map.set(w.id, w.type));
        return map;
    }, [page?.widgets]);

    const layouts: ReactGridLayout.Layouts = useMemo(() => {
        const result: ReactGridLayout.Layouts = {};
        (['lg', 'md', 'sm'] as RGLBreakpoint[]).forEach((bp) => {
            const cols = RGL_COLS[bp];
            result[bp] = (page?.layouts?.[bp] ?? []).map((item: LayoutItem) => {
                const type = widgetTypeById.get(item.i);
                const sizes = type ? WIDGET_SIZES[type] : undefined;
                return sizes
                    ? {...item, minW: Math.min(sizes.minSize.w, cols), minH: sizes.minSize.h}
                    : {...item};
            });
        });
        return result;
    }, [page?.layouts, widgetTypeById]);

    if (!page) {
        return (
            <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2}}>
                <Typography variant="h6">{t('pageNotFound')}</Typography>
                <Stack direction="row" spacing={1.5}>
                    <Link href={scopedHref('/dashboards')} passHref>
                        <Button variant="contained">{t('customDashboards')}</Button>
                    </Link>
                    <Link href={scopedHref('/')} passHref>
                        <Button variant="outlined">{t('dashboard')}</Button>
                    </Link>
                </Stack>
            </Box>
        );
    }

    if (!mounted) return null;

    const configWidget = configWidgetId
        ? page.widgets.find((w) => w.id === configWidgetId) ?? null
        : null;

    return (
        <Box sx={{width: '100%'}} data-testid="custom-dashboard-host">
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={RGL_BREAKPOINTS}
                cols={RGL_COLS}
                rowHeight={RGL_ROW_HEIGHT}
                margin={[8, 8]}
                containerPadding={[0, 0]}
                draggableHandle=".widget-drag-handle"
                isDraggable={editMode}
                isResizable={editMode}
                compactType="vertical"
                onLayoutChange={(_current: ReactGridLayout.Layout[], allLayouts: ReactGridLayout.Layouts) => {
                    if (!editMode) return;
                    dispatch(updateLayouts({
                        pageId,
                        layouts: allLayouts as Partial<Record<RGLBreakpoint, LayoutItem[]>>,
                    }));
                }}
            >
                {page.widgets.map((widget: WidgetInstance) => {
                    const entry = WIDGET_REGISTRY[widget.type];
                    return (
                        <div key={widget.id}>
                            <WidgetFrame
                                widget={widget}
                                editMode={editMode}
                                onConfigure={() => setConfigWidgetId(widget.id)}
                                onRemove={() => dispatch(removeWidget({pageId, widgetId: widget.id}))}
                            >
                                <WidgetErrorBoundary widgetName={widget.title ?? widget.type}>
                                    {entry ? (
                                        <entry.component page={page} widget={widget}/>
                                    ) : (
                                        <Box sx={{p: 2}}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('unknownWidgetType')}: {widget.type}
                                            </Typography>
                                        </Box>
                                    )}
                                </WidgetErrorBoundary>
                            </WidgetFrame>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>

            <WidgetConfigDialog
                page={page}
                widget={configWidget}
                onClose={() => setConfigWidgetId(null)}
            />

            {page.widgets.length === 0 && (
                <Paper variant="outlined" sx={{p: 4, textAlign: 'center', mt: 2}}>
                    <Typography color="text.secondary">{t('emptyPageHint')}</Typography>
                </Paper>
            )}
        </Box>
    );
}
