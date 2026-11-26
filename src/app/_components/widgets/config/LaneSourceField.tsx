"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo} from "react";
import {
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Stack,
} from "@mui/material";
import {useSelector} from "react-redux";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {LaneSource} from "@/lib/layout/PageConfigTypes";
import {useLanguage} from "@/app/contexts/LanguageContext";

interface LaneSourceFieldProps {
    value: LaneSource;
    onChange: (next: LaneSource) => void;
}

/** "Follow page lane" vs. "Specific lane" selector for single-lane widgets. */
export default function LaneSourceField({value, onChange}: LaneSourceFieldProps) {
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

    const mode = value?.source ?? 'page';
    const explicitLane = value?.source === 'explicit' ? value.lane : (laneNames[0] ?? '');

    return (
        <Stack spacing={1}>
            <RadioGroup
                row
                value={mode}
                onChange={(e) => {
                    if (e.target.value === 'page') onChange({source: 'page'});
                    else onChange({source: 'explicit', lane: explicitLane || laneNames[0] || ''});
                }}
            >
                <FormControlLabel value="page" control={<Radio size="small"/>} label={t('followPageLane')}/>
                <FormControlLabel value="explicit" control={<Radio size="small"/>} label={t('specificLane')}/>
            </RadioGroup>
            {mode === 'explicit' && (
                <FormControl size="small" fullWidth>
                    <InputLabel id="lane-source-label">{t('laneId')}</InputLabel>
                    <Select
                        labelId="lane-source-label"
                        label={t('laneId')}
                        value={laneNames.includes(explicitLane) ? explicitLane : ''}
                        onChange={(e) => onChange({source: 'explicit', lane: e.target.value})}
                    >
                        {laneNames.map((lane) => (
                            <MenuItem key={lane} value={lane}>{lane}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Stack>
    );
}
