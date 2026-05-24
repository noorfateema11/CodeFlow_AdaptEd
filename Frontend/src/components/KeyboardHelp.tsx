/**
 * KeyboardHelp.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * DROP-IN: src/components/KeyboardHelp.tsx
 *
 * Modal dialog listing all keyboard shortcuts.
 * Traps focus when open. ESC closes it.
 *
 * Usage:
 *   <KeyboardHelp open={showHelp} onClose={() => setShowHelp(false)} />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';

interface KeyboardHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Tab'], desc: 'Move to next focusable element' },
  { keys: ['Shift', 'Tab'], desc: 'Move to previous element' },
  { keys: ['Enter'], desc: 'Activate focused button / link' },
  { keys: ['Space'], desc: 'Pause / Resume narration (or start reading)' },
  { keys: ['Esc'], desc: 'Stop narration completely' },
  { keys: ['↑'], desc: 'Previous paragraph' },
  { keys: ['↓'], desc: 'Next paragraph' },
  { keys: ['R'], desc: 'Re-read current paragraph' },
  { keys: ['B'], desc: 'Bookmark current paragraph' },
  { keys: ['G'], desc: 'Jump to first bookmark' },
  { keys: ['+', '='], desc: 'Increase reading speed (+0.25×)' },
  { keys: ['-'], desc: 'Decrease reading speed (−0.25×)' },
  { keys: ['?', '/'], desc: 'Show / hide this help' },
];

export default function KeyboardHelp({ open, onClose }: KeyboardHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
  }, [open]);

  // Trap focus inside modal
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        style={{
          background: '#1a1040',
          color: '#e0d8ff',
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth: 480,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
          fontFamily: "'Atkinson Hyperlegible', 'Nunito', sans-serif",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2
            id="keyboard-help-title"
            style={{ margin: 0, fontSize: '1.1rem', color: '#a78bfa', fontWeight: 700 }}
          >
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none', color: '#c4b5fd',
              borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', fontSize: '0.85rem',
            }}
          >
            ✕ Close
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', color: '#7c6fcd', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: 8 }}>Key</th>
              <th style={{ textAlign: 'left', color: '#7c6fcd', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(({ keys, desc }) => (
              <tr key={desc}>
                <td style={{ paddingRight: 16, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {keys.map(k => (
                      <kbd
                        key={k}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 5,
                          padding: '2px 7px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: '#d4c7ff',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </td>
                <td style={{ fontSize: '0.82rem', color: '#c4b5fd', paddingBottom: 4 }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 16, fontSize: '0.72rem', color: '#6b5ea8', textAlign: 'center' }}>
          Shortcuts are active when Blind Mode is on. Press Esc or click outside to close.
        </p>
      </div>
    </div>
  );
}
