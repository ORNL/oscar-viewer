import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {enableMapSet} from "immer";
import {REHYDRATE} from "redux-persist";
import {RootState} from "@/lib/state/Store";
import {EventTableData} from "@/lib/data/oscar/TableHelpers";

enableMapSet();

export interface IEventDataState {
    selectedEvent: EventTableData | null;
    adjudicatedEventId: number | null;
    triggerAlarm: boolean;
    dashboardUnreadAlarmCount: number;
    dashboardUnreadCountCapped: boolean;
    dashboardAcknowledgeNonce: number;
    dashboardUnreadOnly: boolean;
}

const initialState: IEventDataState = {
    selectedEvent: null,
    adjudicatedEventId: null,
    triggerAlarm: false,
    dashboardUnreadAlarmCount: 0,
    dashboardUnreadCountCapped: false,
    dashboardAcknowledgeNonce: 0,
    dashboardUnreadOnly: false,
};

export const Slice = createSlice({
    name: "EventDataState",
    initialState,
    reducers: {
        setSelectedEvent: (state, action: PayloadAction<EventTableData>) => {
            state.selectedEvent = action.payload;
        },
        setAdjudicatedEventId(state, action: PayloadAction<number | null>) {
            state.adjudicatedEventId = action.payload;
        },
        setAlarmTrigger(state, action: PayloadAction<boolean | null>) {
            state.triggerAlarm = Boolean(action.payload);
        },
        setDashboardUnreadAlarmCount(state, action: PayloadAction<number>) {
            state.dashboardUnreadAlarmCount = Math.max(0, Math.floor(action.payload || 0));
            state.dashboardUnreadCountCapped = false;
        },
        setDashboardUnreadAlarmSummary(
            state,
            action: PayloadAction<{count: number; capped?: boolean}>,
        ) {
            state.dashboardUnreadAlarmCount = Math.max(0, Math.floor(action.payload?.count || 0));
            state.dashboardUnreadCountCapped = Boolean(action.payload?.capped);
        },
        requestDashboardAcknowledgeAll(state) {
            state.dashboardAcknowledgeNonce = (state.dashboardAcknowledgeNonce ?? 0) + 1;
            state.dashboardUnreadAlarmCount = 0;
            state.dashboardUnreadCountCapped = false;
        },
        setDashboardUnreadOnly(state, action: PayloadAction<boolean>) {
            state.dashboardUnreadOnly = Boolean(action.payload);
        },
        toggleDashboardUnreadOnly(state) {
            state.dashboardUnreadOnly = !state.dashboardUnreadOnly;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(REHYDRATE, (state) => {
            state.triggerAlarm = false;
            state.dashboardUnreadAlarmCount = 0;
            state.dashboardUnreadCountCapped = false;
            state.dashboardAcknowledgeNonce = 0;
            state.dashboardUnreadOnly = false;
        });
    },
});

export const {
    setSelectedEvent,
    setAdjudicatedEventId,
    setAlarmTrigger,
    setDashboardUnreadAlarmCount,
    setDashboardUnreadAlarmSummary,
    requestDashboardAcknowledgeAll,
    setDashboardUnreadOnly,
    toggleDashboardUnreadOnly,
} = Slice.actions;

export const selectTriggeredAlarm = (state: RootState) => Boolean(state.eventLogSlice?.triggerAlarm);
export const selectSelectedEvent = (state: RootState) => state.eventLogSlice?.selectedEvent ?? null;
export const selectAdjudicatedEventId = (state: RootState) => state.eventLogSlice?.adjudicatedEventId ?? null;
export const selectDashboardUnreadAlarmCount = (state: RootState) =>
    state.eventLogSlice?.dashboardUnreadAlarmCount ?? 0;
export const selectDashboardUnreadCountCapped = (state: RootState) =>
    Boolean(state.eventLogSlice?.dashboardUnreadCountCapped);
export const selectDashboardAcknowledgeNonce = (state: RootState) =>
    state.eventLogSlice?.dashboardAcknowledgeNonce ?? 0;
export const selectDashboardUnreadOnly = (state: RootState) =>
    Boolean(state.eventLogSlice?.dashboardUnreadOnly);

export default Slice.reducer;
