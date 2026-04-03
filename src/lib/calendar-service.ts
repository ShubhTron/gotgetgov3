import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { SPORTS, type SportType } from '@/types';

export interface CalendarEventPayload {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  isAllDay?: boolean;
}

export type CalendarPlatform = 'ios' | 'android';

function getCurrentPlatform(): CalendarPlatform | null {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return null;
}

export const calendarService = {
  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  },

  getPlatform(): CalendarPlatform | null {
    return getCurrentPlatform();
  },

  async hasPermission(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const { result } = await CapacitorCalendar.checkPermission({ scope: 'writeCalendar' as any });
      return result === 'granted';
    } catch {
      return false;
    }
  },

  async requestPermission(): Promise<boolean> {
    // Web: simulate granted for UI testing
    if (!this.isAvailable()) return true;
    try {
      const { result } = await CapacitorCalendar.requestFullCalendarAccess();
      return result === 'granted';
    } catch {
      return false;
    }
  },

  async createEvent(payload: CalendarEventPayload): Promise<string | null> {
    // Web: return a mock event ID for UI testing
    if (!this.isAvailable()) {
      console.log('[CalendarService] Web mock createEvent:', payload);
      return `web-mock-${Date.now()}`;
    }
    try {
      const { id } = await CapacitorCalendar.createEvent({
        title: payload.title,
        startDate: payload.startDate.getTime(),
        endDate: payload.endDate.getTime(),
        location: payload.location,
        description: payload.notes,
        isAllDay: payload.isAllDay ?? false,
      });
      return id;
    } catch (err) {
      console.error('[CalendarService] createEvent failed', err);
      return null;
    }
  },

  async updateEvent(nativeEventId: string, payload: Partial<CalendarEventPayload>): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('[CalendarService] Web mock updateEvent:', nativeEventId, payload);
      return true;
    }
    try {
      await CapacitorCalendar.modifyEvent({
        id: nativeEventId,
        ...(payload.title && { title: payload.title }),
        ...(payload.startDate && { startDate: payload.startDate.getTime() }),
        ...(payload.endDate && { endDate: payload.endDate.getTime() }),
        ...(payload.location !== undefined && { location: payload.location }),
        ...(payload.notes !== undefined && { description: payload.notes }),
      });
      return true;
    } catch (err) {
      console.error('[CalendarService] updateEvent failed', err);
      return false;
    }
  },

  async deleteEvent(nativeEventId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('[CalendarService] Web mock deleteEvent:', nativeEventId);
      return true;
    }
    try {
      await CapacitorCalendar.deleteEvent({ id: nativeEventId });
      return true;
    } catch (err) {
      console.error('[CalendarService] deleteEvent failed', err);
      return false;
    }
  },
};

// --- Payload builders ---

export function buildChallengeEvent(challenge: {
  sport?: SportType;
  format?: string;
  location?: string;
  court_name?: string;
  clubs?: { name: string };
  proposed_times?: string[];
  confirmed_time?: string | null;
}, opponentName?: string): CalendarEventPayload {
  const rawTime = challenge.confirmed_time || challenge.proposed_times?.[0];
  const startDate = rawTime ? new Date(rawTime) : new Date();
  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // +90 min

  const formatLabel = challenge.format === 'singles' ? 'Singles' : 'Doubles';
  const title = opponentName
    ? `${formatLabel} Match vs ${opponentName}`
    : `${formatLabel} Match`;

  const location = challenge.location || challenge.court_name || challenge.clubs?.name;
  const sportName = challenge.sport ? (SPORTS[challenge.sport]?.name ?? challenge.sport) : undefined;
  const notes = [
    sportName && `Sport: ${sportName}`,
    challenge.format && `Format: ${challenge.format}`,
    'via GotGetGov',
  ]
    .filter(Boolean)
    .join(' | ');

  return { title, startDate, endDate, location, notes };
}

export function buildEventPayload(event: {
  name: string;
  start_time: string;
  end_time?: string | null;
  court_name?: string | null;
  clubs?: { name: string };
}): CalendarEventPayload {
  const startDate = new Date(event.start_time);
  const endDate = event.end_time
    ? new Date(event.end_time)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hr default

  return {
    title: event.name,
    startDate,
    endDate,
    location: event.court_name || event.clubs?.name,
    notes: 'via GotGetGov',
  };
}

export function buildCompetitionPayload(competition: {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  clubs?: { name: string };
}): CalendarEventPayload {
  const startDate = competition.start_date ? new Date(competition.start_date) : new Date();
  const endDate = competition.end_date
    ? new Date(competition.end_date)
    : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  return {
    title: competition.name,
    startDate,
    endDate,
    location: competition.clubs?.name,
    notes: 'via GotGetGov',
    isAllDay: true,
  };
}
