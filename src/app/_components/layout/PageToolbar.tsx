"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo, useState} from "react";
import {createPortal} from "react-dom";
import {
    Box,
    Button,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImportExportRoundedIcon from "@mui/icons-material/ImportExportRounded";
import {useSelector} from "react-redux";
import {useRouter} from "next/navigation";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {useAppDispatch} from "@/lib/state/Hooks";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {selectCurrentLane, setCurrentLane} from "@/lib/state/LaneViewSlice";
import {PageConfig} from "@/lib/layout/PageConfigTypes";
import {
    removePage,
    resetPageToDefault,
    selectEditModePageId,
    selectPageById,
    selectPages,
    setEditMode,
    setPageLaneContext,
} from "@/lib/state/PageLayoutSlice";
import AddWidgetDialog from "./AddWidgetDialog";
import PageSettingsDialog from "./PageSettingsDialog";
import ImportExportDialog from "./ImportExportDialog";
import {useHeaderSlotState} from "./HeaderSlot";
import {useLanguage} from "@/app/contexts/LanguageContext";

interface PageToolbarProps {
    pageId: string;
    leading?: React.ReactNode;
}

/**
 * Toolbar for an active custom dashboard: lane selector, edit-mode toggle,
 * Add Widget dialog trigger, and page actions menu. Portals into the `Navbar`
 * header slot when inside `HeaderSlotProvider`, or renders inline when mounted
 * standalone.
 */
export default function PageToolbar({pageId, leading}: PageToolbarProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const {t} = useLanguage();
    const theme = useTheme();
    const {scopedHref, laneMapRef} = useContext(DataSourceContext);
    const {node: headerSlot, hasProvider} = useHeaderSlotState();
    const showLabels = useMediaQuery(theme.breakpoints.up('md'));

    const page: PageConfig | undefined = useSelector(selectPageById(pageId));
    const allPages = useSelector(selectPages);
    const editMode = useSelector(selectEditModePageId) === pageId;
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const globalCurrentLane = useSelector(selectCurrentLane);

    const laneNames = useMemo(() => {
        const map = convertToMap(laneMapRaw);
        const effective = map.size > 0 ? map : laneMapRef?.current;
        return effective
            ? [...effective.keys()].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))
            : [];
    }, [laneMapRaw, laneMapRef]);

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [addWidgetOpen, setAddWidgetOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);

    if (!page) return null;

    const title = page.title;
    const hasTemplate = !!page.templateId;

    const selectedLane = page.laneContext?.mode === 'fixed'
        ? page.laneContext.lane
        : (globalCurrentLane ?? '');

    const handleLaneChange = (lane: string) => {
        if (page.laneContext?.mode === 'fixed') {
            dispatch(setPageLaneContext({pageId, laneContext: {mode: 'fixed', lane}}));
        } else {
            dispatch(setCurrentLane(lane));
        }
    };

    const handleDeletePage = () => {
        setMenuAnchor(null);
        const remaining = allPages.filter((p) => p.id !== pageId);
        dispatch(removePage(pageId));
        if (remaining.length > 0) {
            router.push(scopedHref(`/dashboards/?id=${encodeURIComponent(remaining[0].id)}`));
        } else {
            router.push(scopedHref('/dashboards'));
        }
    };

    const content = (
        <>
            <Box sx={{width: '1px', alignSelf: 'stretch', my: 1, bgcolor: 'divider', flexShrink: 0}}/>
            {leading}
            <Typography
                variant="subtitle1"
                noWrap
                sx={{fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis'}}
            >
                {title}
            </Typography>

            {page.laneContext && laneNames.length > 0 && (
                <FormControl size="small" sx={{minWidth: 140, flexShrink: 0}}>
                    <InputLabel id={`lane-ctx-${pageId}`}>{t('laneId')}</InputLabel>
                    <Select
                        labelId={`lane-ctx-${pageId}`}
                        label={t('laneId')}
                        value={laneNames.includes(selectedLane) ? selectedLane : ''}
                        onChange={(e) => handleLaneChange(e.target.value)}
                    >
                        {laneNames.map((lane) => (
                            <MenuItem key={lane} value={lane}>{lane}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            <Box sx={{flex: 1}}/>

            {editMode && (
                <Tooltip title={t('addWidget')}>
                    {showLabels ? (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddRoundedIcon/>}
                            onClick={() => setAddWidgetOpen(true)}
                            data-testid="add-widget-button"
                            sx={{flexShrink: 0}}
                        >
                            {t('addWidget')}
                        </Button>
                    ) : (
                        <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => setAddWidgetOpen(true)}
                            data-testid="add-widget-button"
                        >
                            <AddRoundedIcon/>
                        </IconButton>
                    )}
                </Tooltip>
            )}

            <Tooltip title={editMode ? t('lockLayout') : t('editLayout')}>
                {showLabels ? (
                    <Button
                        variant={editMode ? 'contained' : 'outlined'}
                        size="small"
                        color={editMode ? 'primary' : 'inherit'}
                        startIcon={editMode ? <LockRoundedIcon/> : <EditRoundedIcon/>}
                        onClick={() => dispatch(setEditMode(editMode ? null : pageId))}
                        data-testid="edit-mode-toggle"
                        sx={{flexShrink: 0}}
                    >
                        {editMode ? t('done') : t('editLayout')}
                    </Button>
                ) : (
                    <IconButton
                        size="small"
                        color={editMode ? 'primary' : 'inherit'}
                        onClick={() => dispatch(setEditMode(editMode ? null : pageId))}
                        data-testid="edit-mode-toggle"
                    >
                        {editMode ? <LockRoundedIcon/> : <EditRoundedIcon/>}
                    </IconButton>
                )}
            </Tooltip>

            <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                data-testid="page-menu-button"
                sx={{flexShrink: 0}}
            >
                <MoreVertRoundedIcon/>
            </IconButton>
            <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => { setMenuAnchor(null); setSettingsOpen(true); }}>
                    <ListItemIcon><SettingsRoundedIcon fontSize="small"/></ListItemIcon>
                    <ListItemText>{t('pageSettings')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setMenuAnchor(null); setImportExportOpen(true); }}>
                    <ListItemIcon><ImportExportRoundedIcon fontSize="small"/></ListItemIcon>
                    <ListItemText>{t('importExport')}</ListItemText>
                </MenuItem>
                {hasTemplate && (
                    <MenuItem onClick={() => { setMenuAnchor(null); dispatch(resetPageToDefault(pageId)); }}>
                        <ListItemIcon><RestartAltRoundedIcon fontSize="small"/></ListItemIcon>
                        <ListItemText>{t('resetPage')}</ListItemText>
                    </MenuItem>
                )}
                <Divider/>
                <MenuItem onClick={handleDeletePage} data-testid="delete-page-menu-item">
                    <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small"/></ListItemIcon>
                    <ListItemText>{t('deletePage')}</ListItemText>
                </MenuItem>
            </Menu>

            <AddWidgetDialog pageId={pageId} open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)}/>
            <PageSettingsDialog page={page} open={settingsOpen} onClose={() => setSettingsOpen(false)}/>
            <ImportExportDialog open={importExportOpen} onClose={() => setImportExportOpen(false)} currentPage={page}/>
        </>
    );

    if (!hasProvider) {
        return (
            <Box data-testid="page-toolbar-inline" sx={{display: 'flex', alignItems: 'center', gap: 1, py: 0.5}}>
                {content}
            </Box>
        );
    }
    if (!headerSlot) return null;
    return createPortal(content, headerSlot);
}
