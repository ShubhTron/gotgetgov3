import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { MessageWithSender } from '../types/circles';
import {
  EMMA_CONV_ID,
  makeEmmaMessageWithSender,
  EMMA_GREETING_TEXT,
  EMMA_REPLY_TEXT,
  EMMA_PROFILE,
} from '../data/emmaDemoProfile';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TutorialStep =
  | 'inactive'
  | 'swipe_card'
  | 'go_to_notifications'
  | 'accept_connection'
  | 'go_to_messages'
  | 'emma_greeting'
  | 'send_message'
  | 'emma_accepts'
  | 'complete';

export interface GuestTutorialContextType {
  tutorialStep: TutorialStep;
  tutorialMessages: MessageWithSender[];
  isTutorialActive: boolean;
  startTutorial: () => void;
  resetTutorial: () => void;
  advanceTutorial: (toStep: TutorialStep) => void;
  skipTutorial: () => void;
  addUserMessage: (content: string) => void;
  registerTarget: (step: TutorialStep, el: HTMLElement | null) => void;
  targetElements: Partial<Record<TutorialStep, HTMLElement>>;
}

const GuestTutorialContext = createContext<GuestTutorialContextType | null>(null);

// ─── Storage keys ─────────────────────────────────────────────────────────────

const SKIP_KEY = 'gg-tutorial-skipped';
const STEP_KEY = 'gg-tutorial-step';

const POST_GREETING_STEPS: TutorialStep[] = ['send_message', 'emma_accepts', 'complete'];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GuestTutorialProvider({ children }: { children: React.ReactNode }) {
  const { isGuest } = useAuth();

  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(() => {
    if (localStorage.getItem(SKIP_KEY)) return 'complete';
    const saved = sessionStorage.getItem(STEP_KEY) as TutorialStep | null;
    return saved ?? 'inactive';
  });

  const [tutorialMessages, setTutorialMessages] = useState<MessageWithSender[]>(() => {
    const saved = sessionStorage.getItem(STEP_KEY) as TutorialStep | null;
    if (saved && POST_GREETING_STEPS.includes(saved)) {
      return [makeEmmaMessageWithSender(EMMA_GREETING_TEXT)];
    }
    return [];
  });

  const [targetElements, setTargetElements] = useState<Partial<Record<TutorialStep, HTMLElement>>>({});

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Persist step to sessionStorage for refresh resilience
  useEffect(() => {
    if (tutorialStep !== 'inactive') {
      sessionStorage.setItem(STEP_KEY, tutorialStep);
    }
  }, [tutorialStep]);

  // Reset tutorial if user exits guest mode
  useEffect(() => {
    if (!isGuest && tutorialStep !== 'inactive' && tutorialStep !== 'complete') {
      clearPendingTimeouts();
      setTutorialStep('inactive');
      setTutorialMessages([]);
    }
  }, [isGuest]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => { clearPendingTimeouts(); }, []);

  function clearPendingTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  const startTutorial = useCallback(() => {
    if (localStorage.getItem(SKIP_KEY)) return;
    clearPendingTimeouts();
    setTutorialMessages([]);
    setTutorialStep('swipe_card');
  }, []);

  // Force-restart regardless of skip key (used by the Reset button on the Discover page)
  const resetTutorial = useCallback(() => {
    localStorage.removeItem(SKIP_KEY);
    sessionStorage.removeItem(STEP_KEY);
    clearPendingTimeouts();
    setTutorialMessages([]);
    setTutorialStep('swipe_card');
  }, []);

  const advanceTutorial = useCallback((toStep: TutorialStep) => {
    clearPendingTimeouts();
    setTutorialStep(toStep);

    if (toStep === 'emma_greeting') {
      const t = setTimeout(() => {
        setTutorialMessages([makeEmmaMessageWithSender(EMMA_GREETING_TEXT)]);
        setTutorialStep('send_message');
      }, 1000);
      timeoutsRef.current.push(t);
    }

    if (toStep === 'emma_accepts') {
      const t = setTimeout(() => {
        setTutorialMessages(prev => [
          ...prev,
          makeEmmaMessageWithSender(EMMA_REPLY_TEXT),
        ]);
        setTutorialStep('complete');
      }, 1500);
      timeoutsRef.current.push(t);
    }
  }, []);

  const skipTutorial = useCallback(() => {
    clearPendingTimeouts();
    localStorage.setItem(SKIP_KEY, 'true');
    sessionStorage.removeItem(STEP_KEY);
    setTutorialStep('complete');
    setTutorialMessages([]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const msg: MessageWithSender = {
      message: {
        id: `user-msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conversation_id: EMMA_CONV_ID,
        sender_id: 'guest',
        content,
        encrypted_content: null,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
      },
      sender: { ...EMMA_PROFILE, id: 'guest', full_name: 'You' },
      isMine: true,
    };
    setTutorialMessages(prev => [...prev, msg]);
  }, []);

  const registerTarget = useCallback((step: TutorialStep, el: HTMLElement | null) => {
    setTargetElements(prev => {
      if (!el) {
        const next = { ...prev };
        delete next[step];
        return next;
      }
      return { ...prev, [step]: el };
    });
  }, []);

  const isTutorialActive = tutorialStep !== 'inactive' && tutorialStep !== 'complete';

  return (
    <GuestTutorialContext.Provider value={{
      tutorialStep,
      tutorialMessages,
      isTutorialActive,
      startTutorial,
      resetTutorial,
      advanceTutorial,
      skipTutorial,
      addUserMessage,
      registerTarget,
      targetElements,
    }}>
      {children}
    </GuestTutorialContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGuestTutorial(): GuestTutorialContextType {
  const ctx = useContext(GuestTutorialContext);
  if (!ctx) throw new Error('useGuestTutorial must be used within GuestTutorialProvider');
  return ctx;
}
