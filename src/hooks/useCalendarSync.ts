import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { calendarService, type CalendarEventPayload } from '@/lib/calendar-service';
import { useAuth } from '@/contexts/AuthContext';

type ItemType = 'challenge' | 'event' | 'competition';

function isConnected(): boolean {
  return localStorage.getItem('calendar_connected') === 'true';
}

export function useCalendarSync() {
  const { user } = useAuth();

  const connected = isConnected();

  const syncCreate = useCallback(
    async (itemType: ItemType, itemId: string, payload: CalendarEventPayload): Promise<void> => {
      if (!user || !calendarService.isAvailable()) return;

      const platform = calendarService.getPlatform();
      if (!platform) return;

      const nativeEventId = await calendarService.createEvent(payload);
      if (!nativeEventId) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('calendar_event_mappings').upsert(
        { user_id: user.id, item_type: itemType, item_id: itemId, native_event_id: nativeEventId, platform },
        { onConflict: 'user_id,item_type,item_id,platform' }
      );
    },
    [user]
  );

  const syncUpdate = useCallback(
    async (itemType: ItemType, itemId: string, payload: Partial<CalendarEventPayload>): Promise<void> => {
      if (!user || !calendarService.isAvailable()) return;

      const platform = calendarService.getPlatform();
      if (!platform) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('calendar_event_mappings')
        .select('native_event_id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('platform', platform)
        .maybeSingle();

      if (!data?.native_event_id) return;

      await calendarService.updateEvent(data.native_event_id, payload);
    },
    [user]
  );

  const syncDelete = useCallback(
    async (itemType: ItemType, itemId: string): Promise<void> => {
      if (!user || !calendarService.isAvailable()) return;

      const platform = calendarService.getPlatform();
      if (!platform) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('calendar_event_mappings')
        .select('native_event_id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('platform', platform)
        .maybeSingle();

      if (!data?.native_event_id) return;

      await calendarService.deleteEvent(data.native_event_id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('calendar_event_mappings')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('platform', platform);
    },
    [user]
  );

  return { connected, syncCreate, syncUpdate, syncDelete };
}
