import React, { useEffect, useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface BlindHUDProps {
  onShowHelp: () => void;
}

export default function BlindHUD({ onShowHelp }: BlindHUDProps) {
  const {
    isBlindMode,
    isSpeaking,
    isPaused,
    rate,
    currentParagraph,
    paragraphs,
    bookmarks,
    pause,
    resume,
    stop,
    nextParagraph,
    prevParagraph,
    addBookmark,
  } = useAccessibility();

  // Live region message
  const [liveMsg, setLiveMsg] = useState('');

  useEffect(() => {
    if (paragraphs[currentParagraph]) {
      setLiveMsg(`Paragraph ${currentParagraph + 1} of ${paragraphs.length}`);
    }
  }, [currentParagraph, paragraphs]);

  if (!isBlindMode) return null;

  const statusIcon = isSpeaking && !isPaused ? '🔊' : isPaused ? '⏸' : '⏹';
  const statusText = isSpeaking && !isPaused ? 'Reading' : isPaused ? 'Paused' : 'Stopped';

  return (
    <>
      {/* ARIA */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="visually-hidden"
        id="a11y-live-region"
      >
        {liveMsg}
      </div>

      {/* Assertive region for critical announcements */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="visually-hidden"
        id="a11y-assertive-region"
      />

      {/* Visual HUD */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          background: 'rgba(20, 16, 48, 0.92)',
          color: '#e0d8ff',
          borderRadius: 14,
          padding: '12px 16px',
          minWidth: 240,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          fontFamily: "'Atkinson Hyperlegible', 'Nunito', sans-serif",
          fontSize: '0.8rem',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        role="status"
        aria-label="Accessibility status panel"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ♿ Blind Mode
          </span>
          <button
            onClick={onShowHelp}
            data-narrate="Keyboard shortcuts help"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#c4b5fd',
              borderRadius: 6,
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '0.72rem',
            }}
            aria-label="Show keyboard shortcuts"
          >
            ? help
          </button>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '1rem' }}>{statusIcon}</span>
          <span style={{ color: '#d4c7ff' }}>{statusText}</span>
          <span style={{ marginLeft: 'auto', color: '#7c6fcd', fontSize: '0.72rem' }}>
            {rate.toFixed(1)}× speed
          </span>
        </div>

        {/* Progress */}
        {paragraphs.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#9d8fd4', fontSize: '0.72rem' }}>
              <span>Paragraph {currentParagraph + 1} / {paragraphs.length}</span>
              {bookmarks.length > 0 && (
                <span>🔖 {bookmarks.length} bookmark{bookmarks.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
              <div
                style={{
                  height: '100%',
                  width: `${paragraphs.length > 0 ? ((currentParagraph + 1) / paragraphs.length) * 100 : 0}%`,
                  background: '#7c6fcd',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: '▲ Prev', action: prevParagraph, key: '↑', narrate: 'Previous paragraph' },
            { label: isPaused ? '▶ Resume' : '⏸ Pause', action: isSpeaking ? (isPaused ? resume : pause) : () => {}, key: 'Space', narrate: isPaused ? 'Resume narration' : 'Pause narration' },
            { label: '⏹ Stop', action: stop, key: 'Esc', narrate: 'Stop narration' },
            { label: '▼ Next', action: nextParagraph, key: '↓', narrate: 'Next paragraph' },
            { label: '🔖 Mark', action: () => addBookmark(), key: 'B', narrate: 'Add bookmark' },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              data-narrate={btn.narrate}
              title={`${btn.narrate} (${btn.key})`}
              aria-label={`${btn.narrate}, keyboard shortcut ${btn.key}`}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#d4c7ff',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.68rem',
                flex: '1 1 auto',
                minWidth: 56,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 6, color: '#6b5ea8', fontSize: '0.62rem', textAlign: 'center' }}>
          Press <kbd style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 3, padding: '0 3px' }}>?</kbd> for all shortcuts
        </div>
      </div>
    </>
  );
}
