"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {Suspense, useContext, useEffect, useMemo, useState} from "react";
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import ImportExportRoundedIcon from "@mui/icons-material/ImportExportRounded";
import ViewQuiltRoundedIcon from "@mui/icons-material/ViewQuiltRounded";
import {useRouter, useSearchParams} from "next/navigation";
import {useSelector} from "react-redux";
import {randomUUID} from "osh-js/source/core/utils/Utils";
import SuspenseLoad from "@/app/_components/SuspenseLoad";
import AddPageDialog from "@/app/_components/layout/AddPageDialog";
import ImportExportDialog from "@/app/_components/layout/ImportExportDialog";
import PageHost from "@/app/_components/layout/PageHost";
import PageToolbar from "@/app/_components/layout/PageToolbar";
import {getPageIcon} from "@/app/_components/layout/WidgetRegistry";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {convertToMap} from "@/app/utils/Utils";
import {buildPageFromTemplate, STARTER_GALLERY_TEMPLATES} from "@/lib/layout/DefaultPages";
import {PageConfig} from "@/lib/layout/PageConfigTypes";
import {useAppDispatch} from "@/lib/state/Hooks";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {
    addPage,
    buildLayoutScopeKey,
    selectPages,
    setActiveLayoutScope,
    setEditMode,
} from "@/lib/state/PageLayoutSlice";
import {RootState} from "@/lib/state/Store";

function DashboardsWorkspaceInner() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const {t} = useLanguage();
    const {scopedHref, currentSession, activeViewKey, laneMapRef} = useContext(DataSourceContext);

    const pages = useSelector(selectPages);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const availableLanes = useMemo(() => {
        const converted = convertToMap(laneMapRaw);
        const effective = converted.size > 0 ? converted : laneMapRef?.current;
        return effective
            ? [...effective.keys()].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))
            : [];
    }, [laneMapRaw, laneMapRef]);

    useEffect(() => {
        dispatch(setActiveLayoutScope(buildLayoutScopeKey(currentSession?.username, activeViewKey)));
    }, [dispatch, currentSession?.username, activeViewKey]);

    const requestedId = searchParams.get("id");
    const [showGallery, setShowGallery] = useState(false);
    const [addPageOpen, setAddPageOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);

    useEffect(() => {
        if (requestedId) {
            setShowGallery(false);
        }
    }, [requestedId]);

    const activePage: PageConfig | undefined = useMemo(() => {
        if (requestedId) {
            return pages.find((p) => p.id === requestedId) ?? pages[0];
        }
        return pages[0];
    }, [pages, requestedId]);

    const uniqueTitle = (baseTitle: string): string => {
        const existing = new Set(pages.map((p) => p.title));
        if (!existing.has(baseTitle)) return baseTitle;
        let suffix = 2;
        while (existing.has(`${baseTitle} (${suffix})`)) {
            suffix += 1;
        }
        return `${baseTitle} (${suffix})`;
    };

    const handleQuickCreateFromTemplate = (templateId: string, titleKey: string, icon: string) => {
        const id = `page-${randomUUID()}`;
        const title = uniqueTitle(t(titleKey));
        const created = buildPageFromTemplate(templateId, {id, title, icon}, availableLanes);
        if (!created) return;
        dispatch(addPage(created));
        setShowGallery(false);
        router.push(scopedHref(`/dashboards/?id=${encodeURIComponent(id)}`));
    };

    const handleQuickCreateBlank = () => {
        const id = `page-${randomUUID()}`;
        const title = uniqueTitle(t("blankPage"));
        const blank: PageConfig = {
            id,
            title,
            icon: "grid",
            showInNav: true,
            widgets: [],
            layouts: {},
        };
        dispatch(addPage(blank));
        dispatch(setEditMode(id));
        setShowGallery(false);
        router.push(scopedHref(`/dashboards/?id=${encodeURIComponent(id)}`));
    };

    const handleSelectDashboard = (id: string) => {
        setShowGallery(false);
        router.push(scopedHref(`/dashboards/?id=${encodeURIComponent(id)}`));
    };

    const displayingGallery = pages.length === 0 || showGallery || !activePage;

    return (
        <Box sx={{width: "100%"}} data-testid="custom-dashboards-page">
            <Paper
                variant="outlined"
                data-testid="custom-dashboards-switcher"
                sx={{
                    p: 1.25,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <DashboardCustomizeRoundedIcon color="primary" fontSize="small"/>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {t("customDashboards")}
                    </Typography>
                    {pages.map((p) => {
                        const selected = !displayingGallery && activePage?.id === p.id;
                        return (
                            <Chip
                                key={p.id}
                                icon={<Box sx={{display: "flex", alignItems: "center", pl: 0.5}}>{getPageIcon(p.icon)}</Box>}
                                label={p.title}
                                clickable
                                color={selected ? "primary" : "default"}
                                variant={selected ? "filled" : "outlined"}
                                onClick={() => handleSelectDashboard(p.id)}
                                data-testid={`dashboard-tab-${p.id}`}
                            />
                        );
                    })}
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    {pages.length > 0 && (
                        <Button
                            size="small"
                            variant={displayingGallery ? "contained" : "outlined"}
                            startIcon={<ViewQuiltRoundedIcon/>}
                            onClick={() => setShowGallery((prev) => !prev)}
                            data-testid="dashboards-templates-button"
                        >
                            {t("starterTemplates")}
                        </Button>
                    )}
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddRoundedIcon/>}
                        onClick={() => setAddPageOpen(true)}
                        data-testid="dashboards-new-page-button"
                    >
                        {t("addPage")}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ImportExportRoundedIcon/>}
                        onClick={() => setImportExportOpen(true)}
                        data-testid="dashboards-import-export-button"
                    >
                        {t("importExport")}
                    </Button>
                </Stack>
            </Paper>

            {displayingGallery ? (
                <Box data-testid="custom-dashboards-gallery">
                    <Box sx={{mb: 2}}>
                        <Typography variant="h6" gutterBottom>
                            {t("customDashboardsWelcomeTitle")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("customDashboardsWelcomeBody")}
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {STARTER_GALLERY_TEMPLATES.map((tpl) => (
                            <Grid item xs={12} sm={6} md={4} key={tpl.id}>
                                <Card variant="outlined" sx={{height: "100%"}}>
                                    <CardActionArea
                                        onClick={() => handleQuickCreateFromTemplate(tpl.id, tpl.titleKey, tpl.icon)}
                                        sx={{height: "100%", p: 0.5}}
                                        data-testid={`starter-template-${tpl.id}`}
                                    >
                                        <CardContent>
                                            <Stack spacing={1}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{color: "primary.main", display: "flex"}}>
                                                        {getPageIcon(tpl.icon)}
                                                    </Box>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {t(tpl.titleKey)}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" color="text.secondary">
                                                    {t(tpl.descriptionKey)}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}

                        <Grid item xs={12} sm={6} md={4}>
                            <Card variant="outlined" sx={{height: "100%", borderStyle: "dashed"}}>
                                <CardActionArea
                                    onClick={handleQuickCreateBlank}
                                    sx={{height: "100%", p: 0.5}}
                                    data-testid="starter-template-blank"
                                >
                                    <CardContent>
                                        <Stack spacing={1}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <AddRoundedIcon color="primary"/>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {t("blankPage")}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                {t("blankPageDesc")}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            ) : (
                activePage && (
                    <>
                        <PageToolbar pageId={activePage.id}/>
                        <PageHost pageId={activePage.id}/>
                    </>
                )
            )}

            <AddPageDialog open={addPageOpen} onClose={() => setAddPageOpen(false)}/>
            <ImportExportDialog
                open={importExportOpen}
                onClose={() => setImportExportOpen(false)}
                currentPage={activePage}
                onImported={(imported) => {
                    if (imported.length > 0) {
                        setShowGallery(false);
                        router.push(scopedHref(`/dashboards/?id=${encodeURIComponent(imported[0].id)}`));
                    }
                }}
            />
        </Box>
    );
}

export default function CustomDashboardsPage() {
    return (
        <Suspense fallback={<SuspenseLoad/>}>
            <DashboardsWorkspaceInner/>
        </Suspense>
    );
}
