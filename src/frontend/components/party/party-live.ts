'use client';

import { createContext, useContext } from 'react';

/** Whether the party's live channel is connected: one subscription, in the frame, for every tab. */
export const PartyLiveContext = createContext(false);
export const usePartyLive = () => useContext(PartyLiveContext);
