"use client";

import {Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {EventTableData} from "@/lib/data/oscar/TableHelpers";
import {useLanguage} from '@/app/contexts/LanguageContext';
import {formatOccupancyStatus, getIntlLocale} from '@/app/utils/LocaleUtils';
import EventIdentity from "@/app/_components/event-details/EventIdentity";
import type {EventIdentityResolutionState} from "@/app/_components/event-details/EventIdentity";

interface DataRowProps {
    eventData: EventTableData;
    nodeId?: string | null;
    identityResolutionState?: EventIdentityResolutionState;
    onRetryIdentity?: () => void;
}

export default function DataRow({
    eventData,
    nodeId,
    identityResolutionState,
    onRetryIdentity,
}: DataRowProps) {
    const {language, t} = useLanguage();
    const formatDate = (value?: string) => value ? new Date(value).toLocaleString(getIntlLocale(language)) : '';
    const formatStatus = (value?: string) => formatOccupancyStatus(value, t, 'unknown');
    const formatInspection = (value?: string) => value ? t(`secondaryInspection.${value.toLowerCase()}`) : '';
    const rawStatus = eventData?.status || 'Unknown';
    const isGamma = rawStatus === 'Gamma';
    const isNeutron = rawStatus === 'Neutron';
    const isGammaNeutron = rawStatus === 'Gamma & Neutron';
    return (
        <Stack>
            <EventIdentity
                occupancyUuid={eventData?.occupancyObsId}
                nodeId={nodeId}
                resolutionState={identityResolutionState}
                onRetry={onRetryIdentity}
            />
            <TableContainer
                role="region"
                aria-label={t('eventDetails')}
                tabIndex={0}
                sx={{maxInlineSize: '100%', overflowX: 'auto'}}
            >
                <Table
                    size="small"
                    sx={{
                        width: '100%',
                        '& th, & td': {
                            px: 1.25,
                            py: 0.85,
                            fontVariantNumeric: 'tabular-nums',
                        },
                    }}
                    aria-label={t('eventDetails')}
                >
                <TableHead>
                    <TableRow
                        sx={{'&:last-child td, &:last-child th': {border: 0, textAlign: "center", whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.8rem"}}}>
                        <TableCell>{t('secondaryInspection')}</TableCell>
                        <TableCell>{t('laneId')}</TableCell>
                        <TableCell>{t('occupancyId')}</TableCell>
                        <TableCell>{t('startTime')}</TableCell>
                        <TableCell>{t('endTime')}</TableCell>
                        <TableCell>{t('maxGamma')}</TableCell>
                        <TableCell>{t('maxNeutron')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                        <TableCell>{t('adjudicated')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {eventData ? (
                        <TableRow key={eventData.id}
                                  sx={{'&:last-child td, &:last-child th': {border: 0, textAlign: "center"}}}>
                            <TableCell>{formatInspection(eventData?.secondaryInspection)}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{eventData?.laneId}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{eventData?.occupancyCount}</TableCell>
                            <TableCell sx={{whiteSpace: "nowrap", fontSize: "0.82rem"}}>{formatDate(eventData?.startTime)}</TableCell>
                            <TableCell sx={{whiteSpace: "nowrap", fontSize: "0.82rem"}}>{formatDate(eventData?.endTime)}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{eventData?.maxGamma}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{eventData?.maxNeutron}</TableCell>
                            <TableCell>
                                <Box
                                    component="span"
                                    className="status-pill"
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        px: 1.25,
                                        py: 0.35,
                                        borderRadius: "999px",
                                        fontSize: "0.76rem",
                                        fontWeight: 600,
                                        lineHeight: 1.2,
                                        whiteSpace: "nowrap",
                                        ...(isGamma && {bgcolor: "error.main", color: "error.contrastText"}),
                                        ...(isNeutron && {bgcolor: "info.main", color: "info.contrastText"}),
                                        ...(isGammaNeutron && {bgcolor: "secondary.main", color: "secondary.contrastText"}),
                                        ...(!isGamma && !isNeutron && !isGammaNeutron && {
                                            bgcolor: "action.hover",
                                            color: "text.secondary",
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }),
                                    }}
                                >
                                    {formatStatus(eventData?.status)}
                                </Box>
                            </TableCell>
                            <TableCell sx={{fontWeight: 500}}>{eventData?.adjudicatedIds.length > 0 ? t('yes') : t('no')}</TableCell>
                        </TableRow>
                    ) : (
                        <TableRow>
                            <TableCell colSpan={9} align="center">{t('noEventData')}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
}
