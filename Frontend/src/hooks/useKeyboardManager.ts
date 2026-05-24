/**
 * useKeyboardManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DROP-IN: src/hooks/useKeyboardManager.ts
 *
 * Registers a single global keydown listener on window.
 * Maps keys to AccessibilityContext actions.
 *
 * Shortcuts (active when blind mode OR narration is enabled):
 *   Space          → pause / resume narration
 *   Escape         → stop narration
 *   ArrowDown      → next paragraph
 *   ArrowUp        → previous paragraph
 *   B              → bookmark current paragraph
 *   G              → jump to first bookmark
 *   +  / =         → increase reading speed
 *   -              → decrease reading speed
 *   ?  / /         → show keyboard help (calls onShowHelp)
 *   R              → re-read current paragraph
 *
 * Usage:
 *   useKeyboardManager({ onShowHelp: () => setShowHelp(true) });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface UseKeyboardManagerOptions {
  /** Called when the user presses ? to toggle the help modal */
  onShowHelp?: () => void;
  /** Set to false to disable all shortcuts temporarily */
  enabled?: boolean;
}

export function useKeyboardManager({
  onShowHelp,
  enabled = true,
}: UseKeyboardManagerOptions = {}) {
  const {
    isBlindMode,
    narrationEnabled,
    isSpeaking,
    isPaused,
    rate,
    pause,
    resume,
    stop,
    nextParagraph,
    prevParagraph,
    addBookmark,
    goToBookmark,
    bookmarks,
    setRate,
    readCurrentParagraph,
  } = useAccessibility();

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (!isBlindMode && !narrationEnabled) return;

      // Ignore shortcuts when typing in an input / textarea / select
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = e.key;

      switch (key) {
        case ' ':
          // Space → pause/resume
          e.preventDefault();
          if (isSpeaking && !isPaused) pause();
          else if (isPaused) resume();
          else readCurrentParagraph();
          break;

        case 'Escape':
          e.preventDefault();
          stop();
          break;

        case 'ArrowDown':
          e.preventDefault();
          nextParagraph();
          break;

        case 'ArrowUp':
          e.preventDefault();
          prevParagraph();
          break;

        case 'b':
        case 'B':
          e.preventDefault();
          addBookmark();
          break;

        case 'g':
        case 'G':
          e.preventDefault();
          if (bookmarks.length > 0) {
            goToBookmark(0);
          }
          break;

        case '+':
        case '=':
          e.preventDefault();
          setRate(Math.min(2, rate + 0.25));
          break;

        case '-':
        case '_':
          e.preventDefault();
          setRate(Math.max(0.5, rate - 0.25));
          break;

        case '?':
        case '/':
          e.preventDefault();
          onShowHelp?.();
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          readCurrentParagraph();
          break;

        default:
          break;
      }
    },
    [
      enabled,
      isBlindMode,
      narrationEnabled,
      isSpeaking,
      isPaused,
      rate,
      pause,
      resume,
      stop,
      nextParagraph,
      prevParagraph,
      addBookmark,
      goToBookmark,
      bookmarks,
      setRate,
      readCurrentParagraph,
      onShowHelp,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
