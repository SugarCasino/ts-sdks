'use client';

import * as React from 'react';
import type { EventLogRow } from '@/lib/sugar-types';

export type EventLogContextValue = {
	rows: Array<EventLogRow>;
	addRows: (rows: Array<EventLogRow>) => void;
	clearRows: () => void;
};

export const EventLogContext = React.createContext<EventLogContextValue | null>(null);
