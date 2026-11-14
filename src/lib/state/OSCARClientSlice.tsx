import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {enableMapSet} from "immer";
import {RootState} from "@/lib/state/Store";

enableMapSet();

export interface IOSCARClientState {
    currentUser: string;
    quickActions: [];
    alertTimeoutSeconds: number;
    alarmAudioVolume: number;
    continuousAlarmAudio: boolean;
    visualUnreadAlert: boolean;
}

const initialState: IOSCARClientState = {
    currentUser: 'testuser',
    quickActions: [],
    alertTimeoutSeconds: 10,
    alarmAudioVolume: 30,
    continuousAlarmAudio: false,
    visualUnreadAlert: false,
};

export const Slice = createSlice({
    name: 'ClientStateSlice',
    initialState,
    reducers: {
        setCurrentUser: (state, action: PayloadAction<string>) => {
            state.currentUser = action.payload;
        },
        setQuickActions: (state, action: PayloadAction<[]>) => {
            state.quickActions = action.payload;
        },
        setAlertTimeoutSeconds: (state, action: PayloadAction<number>) => {
            state.alertTimeoutSeconds = action.payload;
        },
        setAlarmAudioVolume: (state, action: PayloadAction<number>) => {
            state.alarmAudioVolume = action.payload;
        },
        setContinuousAlarmAudio: (state, action: PayloadAction<boolean>) => {
            state.continuousAlarmAudio = action.payload;
        },
        setVisualUnreadAlert: (state, action: PayloadAction<boolean>) => {
            state.visualUnreadAlert = action.payload;
        },
    }
});

export const {
    setCurrentUser,
    setQuickActions,
    setAlertTimeoutSeconds,
    setAlarmAudioVolume,
    setContinuousAlarmAudio,
    setVisualUnreadAlert,
} = Slice.actions;

export const selectCurrentUser = (state: RootState) => state.oscarClientSlice?.currentUser ?? 'testuser';
export const selectAlarmAudioVolume = (state: RootState) => state.oscarClientSlice?.alarmAudioVolume ?? 30;
export const selectContinuousAlarmAudio = (state: RootState) => Boolean(state.oscarClientSlice?.continuousAlarmAudio);
export const selectVisualUnreadAlert = (state: RootState) => Boolean(state.oscarClientSlice?.visualUnreadAlert);

export default Slice.reducer;
