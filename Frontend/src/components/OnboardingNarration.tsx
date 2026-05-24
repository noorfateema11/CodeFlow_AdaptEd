import { useEffect, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface OnboardingNarrationProps {
  trigger: boolean;
  userName?: string;
}

const LS_SEEN = 'adapted_onboarding_seen';

export default function OnboardingNarration({ trigger, userName }: OnboardingNarrationProps) {
  const { isBlindMode, narrationEnabled, speak } = useAccessibility();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!trigger) return;
    if (!isBlindMode || !narrationEnabled) return;
    if (hasFired.current) return;

    hasFired.current = true;

    const isFirstTime = !localStorage.getItem(LS_SEEN);

    const greeting = userName ? `Welcome back, ${userName}.` : 'Welcome back.';

    const message = isFirstTime
      ? `${greeting} You are now in Blind Accessibility Mode. ` +
        `Press Tab to navigate between elements. ` +
        `Press Space to pause or resume narration. ` +
        `Press Escape to stop reading. ` +
        `Press Arrow Down or Arrow Up to move between paragraphs. ` +
        `Press B to bookmark your current position. ` +
        `Press question mark at any time to hear all keyboard shortcuts. ` +
        `Upload a PDF to begin. Enjoy your session.`
      : `${greeting} Blind mode is active. Press Tab to navigate. ` +
        `Press Space to start reading, and question mark for shortcuts.`;

    const timeout = setTimeout(() => {
      speak(message);
      localStorage.setItem(LS_SEEN, '1');
    }, 800);

    return () => clearTimeout(timeout);
  }, [trigger, isBlindMode, narrationEnabled, speak, userName]);
  return null;
}
