import { useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export function useFocusNarration<T extends HTMLElement = HTMLElement>(
  label: string
) {
  const { speakFocus, isBlindMode } = useAccessibility();
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => {
      if (isBlindMode) speakFocus(label);
    };
    el.addEventListener('focus', handler);
    return () => el.removeEventListener('focus', handler);
  }, [label, speakFocus, isBlindMode]);

  return ref;
}

export function useGlobalFocusNarration() {
  const { speakFocus, isBlindMode } = useAccessibility();

  const handleFocus = useCallback(
    (e: FocusEvent) => {
      if (!isBlindMode) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;

      const label =
        el.getAttribute('data-narrate') ??
        el.getAttribute('aria-label') ??
        el.getAttribute('title') ??
        deriveLabelFromElement(el);

      if (label) speakFocus(label);
    },
    [isBlindMode, speakFocus]
  );

  useEffect(() => {
    document.addEventListener('focus', handleFocus, true); // capture phase
    return () => document.removeEventListener('focus', handleFocus, true);
  }, [handleFocus]);
}


function deriveLabelFromElement(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute('type')?.toLowerCase();

  if (tag === 'button') {
    const text = el.textContent?.trim();
    if (text) return `${text} button`;
    return 'button';
  }

  if (tag === 'a') {
    const text = el.textContent?.trim();
    if (text) return `${text} link`;
    return 'link';
  }

  // input
  if (tag === 'input') {
    const labelEl = document.querySelector(`label[for="${el.id}"]`);
    const labelText = labelEl?.textContent?.trim();
    if (labelText) {
      const typeDesc =
        type === 'password' ? 'password field' :
        type === 'email' ? 'email field' :
        type === 'checkbox' ? 'checkbox' :
        type === 'radio' ? 'radio button' :
        'text field';
      return `${labelText} ${typeDesc}`;
    }
    if (el.getAttribute('placeholder')) {
      return `${el.getAttribute('placeholder')} input`;
    }
    return `${type ?? 'text'} input`;
  }

  // select
  if (tag === 'select') {
    const labelEl = document.querySelector(`label[for="${el.id}"]`);
    return labelEl?.textContent?.trim()
      ? `${labelEl.textContent.trim()} dropdown`
      : 'dropdown';
  }

  // textarea
  if (tag === 'textarea') {
    const labelEl = document.querySelector(`label[for="${el.id}"]`);
    return labelEl?.textContent?.trim()
      ? `${labelEl.textContent.trim()} text area`
      : 'text area';
  }

  return '';
}
