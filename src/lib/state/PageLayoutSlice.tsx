/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {REHYDRATE} from "redux-persist";
import {RootState} from "@/lib/state/Store";
import {
    LAYOUT_BOUNDS,
    LayoutItem,
    PAGE_CONFIG_SCHEMA_VERSION,
    PageConfig,
    PageLaneContext,
    PageLayoutState,
    RGL_COLS,
    RGLBreakpoint,
    WIDGET_INSTANCE_CAPS,
    WIDGET_SIZES,
    WidgetConfig,
    WidgetInstance,
} from "@/lib/layout/PageConfigTypes";
import {buildPageFromTemplate} from "@/lib/layout/DefaultPages";
import {rehydratePageLayoutState, sanitizePageConfig} from "@/lib/layout/ConfigValidation";

export const DEFAULT_LAYOUT_SCOPE_KEY = 'default|__all__';

export function buildLayoutScopeKey(username?: string | null, viewKey?: string | null): string {
    const cleanUser = (username ?? '').trim() || 'default';
    const cleanView = (viewKey ?? '').trim() || '__all__';
    return `${cleanUser}|${cleanView}`;
}

const initialState: PageLayoutState = {
    schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
    activeScopeKey: DEFAULT_LAYOUT_SCOPE_KEY,
    pages: [],
    profiles: {},
    removedSeededPageIds: [],
    editModePageId: null,
};

function syncActiveProfile(state: PageLayoutState) {
    const key = state.activeScopeKey || DEFAULT_LAYOUT_SCOPE_KEY;
    if (!state.profiles) state.profiles = {};
    state.profiles[key] = state.pages;
}

function findPage(state: PageLayoutState, pageId: string): PageConfig | undefined {
    return state.pages.find((p) => p.id === pageId);
}

/** Append a layout item for a new widget at the bottom of every breakpoint within bounds. */
function appendLayoutItems(page: PageConfig, widget: WidgetInstance) {
    const {defaultSize, minSize} = WIDGET_SIZES[widget.type];
    (Object.keys(RGL_COLS) as RGLBreakpoint[]).forEach((bp) => {
        const cols = RGL_COLS[bp];
        const items = page.layouts[bp] ?? [];
        const bottom = items.reduce((max, it) => Math.max(max, it.y + it.h), 0);
        const clampedY = Math.min(LAYOUT_BOUNDS.maxY, Math.max(LAYOUT_BOUNDS.minY, bottom));
        const clampedH = Math.min(LAYOUT_BOUNDS.maxH, Math.max(LAYOUT_BOUNDS.minH, defaultSize.h));
        const newItem: LayoutItem = {
            i: widget.id,
            x: 0,
            y: clampedY,
            w: Math.min(defaultSize.w, cols),
            h: clampedH,
            minW: Math.min(minSize.w, cols),
            minH: Math.min(LAYOUT_BOUNDS.maxH, minSize.h),
        };
        page.layouts[bp] = [...items, newItem];
    });
}

export const Slice = createSlice({
    name: 'pageLayoutSlice',
    initialState,
    reducers: {
        setActiveLayoutScope: (state, action: PayloadAction<string>) => {
            const nextKey = action.payload || DEFAULT_LAYOUT_SCOPE_KEY;
            const prevKey = state.activeScopeKey || DEFAULT_LAYOUT_SCOPE_KEY;
            if (!state.profiles) state.profiles = {};
            state.profiles[prevKey] = state.pages;
            if (nextKey === prevKey) return;
            state.activeScopeKey = nextKey;
            state.pages = state.profiles[nextKey] ?? [];
            state.editModePageId = null;
        },
        addPage: (state, action: PayloadAction<PageConfig>) => {
            if (findPage(state, action.payload.id)) return;
            state.pages.push(sanitizePageConfig(action.payload as PageConfig & Record<string, unknown>));
            syncActiveProfile(state);
        },
        removePage: (state, action: PayloadAction<string>) => {
            state.pages = state.pages.filter((p) => p.id !== action.payload);
            if (state.editModePageId === action.payload) state.editModePageId = null;
            syncActiveProfile(state);
        },
        renamePage: (state, action: PayloadAction<{ pageId: string; title: string }>) => {
            const page = findPage(state, action.payload.pageId);
            if (page) {
                page.title = action.payload.title;
                syncActiveProfile(state);
            }
        },
        setPageIcon: (state, action: PayloadAction<{ pageId: string; icon: string }>) => {
            const page = findPage(state, action.payload.pageId);
            if (page) {
                page.icon = action.payload.icon;
                syncActiveProfile(state);
            }
        },
        reorderPages: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
            const {fromIndex, toIndex} = action.payload;
            if (fromIndex < 0 || fromIndex >= state.pages.length || toIndex < 0 || toIndex >= state.pages.length) return;
            const [moved] = state.pages.splice(fromIndex, 1);
            state.pages.splice(toIndex, 0, moved);
            syncActiveProfile(state);
        },
        setPageLaneContext: (state, action: PayloadAction<{ pageId: string; laneContext: PageLaneContext | undefined }>) => {
            const page = findPage(state, action.payload.pageId);
            if (page) {
                page.laneContext = action.payload.laneContext;
                syncActiveProfile(state);
            }
        },
        addWidget: (state, action: PayloadAction<{ pageId: string; widget: WidgetInstance }>) => {
            const page = findPage(state, action.payload.pageId);
            if (!page || page.widgets.some((w) => w.id === action.payload.widget.id)) return;
            const cap = WIDGET_INSTANCE_CAPS[action.payload.widget.type];
            if (cap !== undefined) {
                const currentCount = page.widgets.filter((w) => w.type === action.payload.widget.type).length;
                if (currentCount >= cap) return;
            }
            page.widgets.push(action.payload.widget);
            appendLayoutItems(page, action.payload.widget);
            syncActiveProfile(state);
        },
        removeWidget: (state, action: PayloadAction<{ pageId: string; widgetId: string }>) => {
            const page = findPage(state, action.payload.pageId);
            if (!page) return;
            page.widgets = page.widgets.filter((w) => w.id !== action.payload.widgetId);
            (Object.keys(page.layouts) as RGLBreakpoint[]).forEach((bp) => {
                page.layouts[bp] = (page.layouts[bp] ?? []).filter((it) => it.i !== action.payload.widgetId);
            });
            syncActiveProfile(state);
        },
        updateWidgetConfig: (state, action: PayloadAction<{ pageId: string; widgetId: string; config: WidgetConfig }>) => {
            const page = findPage(state, action.payload.pageId);
            const widget = page?.widgets.find((w) => w.id === action.payload.widgetId);
            if (widget) {
                widget.config = action.payload.config;
                syncActiveProfile(state);
            }
        },
        updateWidgetTitle: (state, action: PayloadAction<{ pageId: string; widgetId: string; title: string | undefined }>) => {
            const page = findPage(state, action.payload.pageId);
            const widget = page?.widgets.find((w) => w.id === action.payload.widgetId);
            if (widget) {
                widget.title = action.payload.title;
                syncActiveProfile(state);
            }
        },
        updateLayouts: (state, action: PayloadAction<{
            pageId: string;
            layouts: Partial<Record<RGLBreakpoint, LayoutItem[]>>;
        }>) => {
            const page = findPage(state, action.payload.pageId);
            if (!page) return;
            // Retain only entries matching active widgets and clamp geometry within layout bounds.
            const widgetIds = new Set(page.widgets.map((w) => w.id));
            const cleaned: Partial<Record<RGLBreakpoint, LayoutItem[]>> = {};
            (['lg', 'md', 'sm'] as RGLBreakpoint[]).forEach((bp) => {
                const items = action.payload.layouts[bp];
                if (!items) return;
                cleaned[bp] = items
                    .filter((it) => widgetIds.has(it.i))
                    .map(({i, x, y, w, h}) => ({
                        i,
                        x: Math.max(LAYOUT_BOUNDS.minX, Math.min(LAYOUT_BOUNDS.maxXExclusive - 1, Math.round(x))),
                        y: Math.max(LAYOUT_BOUNDS.minY, Math.min(LAYOUT_BOUNDS.maxY, Math.round(y))),
                        w: Math.max(LAYOUT_BOUNDS.minW, Math.min(LAYOUT_BOUNDS.maxW, Math.round(w))),
                        h: Math.max(LAYOUT_BOUNDS.minH, Math.min(LAYOUT_BOUNDS.maxH, Math.round(h))),
                    }));
            });
            page.layouts = cleaned;
            syncActiveProfile(state);
        },
        setEditMode: (state, action: PayloadAction<string | null>) => {
            state.editModePageId = action.payload;
        },
        resetPageToDefault: (state, action: PayloadAction<string>) => {
            const idx = state.pages.findIndex((p) => p.id === action.payload);
            const page = state.pages[idx];
            if (!page?.templateId) return;
            const rebuilt = buildPageFromTemplate(page.templateId, page);
            if (rebuilt) {
                state.pages[idx] = rebuilt;
                syncActiveProfile(state);
            }
        },
        importPages: (state, action: PayloadAction<{ pages: PageConfig[]; mode: 'replace-all' | 'merge' }>) => {
            const sanitizedPages = action.payload.pages.map((p) =>
                sanitizePageConfig(p as PageConfig & Record<string, unknown>)
            );
            const {mode} = action.payload;
            if (mode === 'replace-all') {
                state.pages = sanitizedPages;
            } else {
                const existingTitles = new Set(state.pages.map((p) => p.title));
                for (const incoming of sanitizedPages) {
                    const idx = state.pages.findIndex((p) => p.id === incoming.id);
                    if (idx >= 0) {
                        state.pages[idx] = incoming;
                    } else {
                        let page = incoming;
                        if (existingTitles.has(page.title)) {
                            let n = 2;
                            while (existingTitles.has(`${incoming.title} (${n})`)) n++;
                            page = {...incoming, title: `${incoming.title} (${n})`};
                        }
                        existingTitles.add(page.title);
                        state.pages.push(page);
                    }
                }
            }
            state.editModePageId = null;
            syncActiveProfile(state);
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            (action): action is PayloadAction<any> => action.type === REHYDRATE,
            (state, action: any) => {
                const inbound = action.payload?.pageLayoutSlice;
                if (!inbound) return state;
                return rehydratePageLayoutState(inbound);
            }
        );
    },
});

export const {
    setActiveLayoutScope,
    addPage,
    removePage,
    renamePage,
    setPageIcon,
    reorderPages,
    setPageLaneContext,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    updateWidgetTitle,
    updateLayouts,
    setEditMode,
    resetPageToDefault,
    importPages,
} = Slice.actions;

export const selectPages = (state: RootState) => state.pageLayoutSlice.pages;
export const selectNavPages = (state: RootState) =>
    state.pageLayoutSlice.pages.filter((p: PageConfig) => p.showInNav !== false);
export const selectPageById = (pageId: string) => (state: RootState) =>
    state.pageLayoutSlice.pages.find((p: PageConfig) => p.id === pageId);
export const selectEditModePageId = (state: RootState) => state.pageLayoutSlice.editModePageId;
export const selectActiveLayoutScopeKey = (state: RootState) =>
    state.pageLayoutSlice.activeScopeKey ?? DEFAULT_LAYOUT_SCOPE_KEY;

export default Slice.reducer;
