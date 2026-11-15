"use client";

import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from '@mui/material';
import {useEffect, useId, useState} from 'react';
import {useLanguage} from '@/app/contexts/LanguageContext';

const DEFAULT_SANDIA_DRFS: readonly string[] = [
    "auto",
    "2x2/NaI",
    "3x3/NaI",
    "1x1/CsI Side",
    "Kromek-GR1-CZT",
    "IdentiFINDER-R300",
    "IdentiFINDER-LaBr3",
    "IdentiFINDER-NG",
    "Verifinder",
    "Detective-EX",
    "Falcon 5000",
];

export default function DetectorResponseFunction(props: {
    onSelect: (value: string) => void, // Return selected value
    selectVal: string
}) {
    const {t} = useLanguage();
    const labelId = useId();
    const selectId = useId();

    const [drfChoices, setDrfChoices] = useState<string[]>([...DEFAULT_SANDIA_DRFS]);

    const handleChange = (event: SelectChangeEvent) => {
        const val = event.target.value;
        props.onSelect(val);
    };

    useEffect(() => {
        let cancelled = false;
        async function fetchDrfValues() {
            const url = "https://full-spectrum.sandia.gov/api/v1/info";
            try {
                const response = await fetch(url, { method: 'GET' });
                if (!response.ok) {
                    return;
                }
                const results = await response.json();
                const remote: string[] = Array.isArray(results?.Options?.[0]?.possibleValues)
                    ? results.Options[0].possibleValues
                    : [];
                if (!cancelled && remote.length > 0) {
                    const merged = Array.from(new Set(["auto", ...remote, ...DEFAULT_SANDIA_DRFS]));
                    setDrfChoices(merged);
                }
            } catch {
                // Keep default DRF choices when offline or blocked by CORS/network policy
            }
        }
        void fetchDrfValues();
        return () => {
            cancelled = true;
        };
    }, []);

    const effectiveValue = props.selectVal && drfChoices.includes(props.selectVal)
        ? props.selectVal
        : (props.selectVal || "auto");

    return (
        <FormControl size="small" fullWidth>
            <InputLabel id={labelId}>{t('detectorResponseFunction')}</InputLabel>
            <Select
                variant="outlined"
                labelId={labelId}
                id={selectId}
                data-testid="webid-drf-select"
                label={t('detectorResponseFunction')}
                value={effectiveValue}
                onChange={handleChange}
                MenuProps={{
                    MenuListProps: {
                        style: {
                            maxHeight: 300
                        }
                    }
                }}
                autoWidth
                style={{minWidth: "12em"}}
            >
                {drfChoices.map((item) => (
                    <MenuItem key={item} value={item}>
                        {item}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
