"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo} from "react";
import {
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    Switch,
} from "@mui/material";
import {useSelector} from "react-redux";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {LaneSelection} from "@/lib/layout/PageConfigTypes";
import {useLanguage} from "@/app/contexts/LanguageContext";

interface LaneSelectionFieldProps {
    value: LaneSelection;
    onChange: (next: LaneSelection) => void;
}

/** "All lanes" toggle and multi-lane selector shared across widget configuration forms. */
export default function LaneSelectionField({value, onChange}: LaneSelectionFieldProps) {
    const {laneMapRef} = useContext(DataSourceContext);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const {t} = useLanguage();

    const laneNames: string[] = useMemo(() => {
        const converted = convertToMap(laneMapRaw);
        const effective = converted.size > 0 ? converted : laneMapRef?.current;
        return effective
            ? [...effective.keys()].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))
            : [];
    }, [laneMapRaw, laneMapRef]);

    const allLanes = value.mode === 'all';
    const selected = value.mode === 'include' && Array.isArray(value.lanes) ? value.lanes : laneNames;

    return (
        <Stack spacing={1}>
            <FormControlLabel
                control={
                    <Switch
                        checked={allLanes}
                        onChange={(e) => onChange(e.target.checked
                            ? {mode: 'all'}
                            : {mode: 'include', lanes: laneNames})}
                    />
                }
                label={t('allLanes')}
            />
            {!allLanes && (
                <FormControl size="small" fullWidth>
                    <InputLabel id="lane-select-label">{t('lanes')}</InputLabel>
                    <Select
                        labelId="lane-select-label"
                        label={t('lanes')}
                        multiple
                        value={selected}
                        onChange={(e) => {
                            const next = typeof e.target.value === 'string'
                                ? e.target.value.split(',')
                                : e.target.value;
                            onChange({mode: 'include', lanes: next});
                        }}
                        renderValue={(vals) => (vals as string[]).join(', ')}
                    >
                        {laneNames.map((lane) => (
                            <MenuItem key={lane} value={lane}>
                                <Checkbox checked={selected.includes(lane)} size="small"/>
                                <ListItemText primary={lane}/>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Stack>
    );
}
