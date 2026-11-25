"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {createContext, useContext} from "react";

interface HeaderSlotContextValue {
    node: HTMLElement | null;
    hasProvider: boolean;
}

const HeaderSlotContext = createContext<HeaderSlotContextValue>({
    node: null,
    hasProvider: false,
});

/**
 * Publishes the app-bar toolbar slot owned by `Navbar` so `PageToolbar` can
 * portal controls into the header row without occupying extra vertical height.
 * When rendered standalone outside `HeaderSlotProvider` (such as isolated
 * component tests), `hasProvider` stays `false` so `PageToolbar` renders inline.
 */
export function HeaderSlotProvider({node, children}: { node: HTMLElement | null; children: React.ReactNode }) {
    return (
        <HeaderSlotContext.Provider value={{node, hasProvider: true}}>
            {children}
        </HeaderSlotContext.Provider>
    );
}

export function useHeaderSlot(): HTMLElement | null {
    return useContext(HeaderSlotContext).node;
}

export function useHeaderSlotState(): HeaderSlotContextValue {
    return useContext(HeaderSlotContext);
}
