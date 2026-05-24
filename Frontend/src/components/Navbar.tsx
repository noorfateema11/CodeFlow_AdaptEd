import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface NavbarProps {
  voiceMode: boolean;
  setVoiceMode: (v: boolean) => void;
  dyslexiaMode: boolean;
  setDyslexiaMode: (v: boolean) => void;
  savedNotesCount: number;
  onLogout: () => void;
  isBlindMode?: boolean;
  onShowHelp?: () => void;
}

export default function Navbar({
  dyslexiaMode,
  setDyslexiaMode,
  savedNotesCount,
  onLogout,
  onShowHelp,
}: NavbarProps) {
  const { isBlindMode, narrationEnabled, toggleNarration, enableBlindMode, rate } = useAccessibility();

  return (
    <nav
      className="navbar navbar-expand-lg bg-white border-bottom shadow-sm mb-4 rounded-3 px-3"
      aria-label="Main navigation"
    >
      {/* Brand */}
      <span
        className="navbar-brand fw-bolder text-success fs-4 me-auto"
        aria-label="adaptEd — Empowering Inclusive Learning"
        tabIndex={0}
        data-narrate="adaptEd navigation bar"
      >
        adapt<span className="text-dark">Ed</span>
      </span>

      <div className="d-flex align-items-center gap-3 flex-wrap">

        {/* Dyslexia Mode */}
        <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="dyslexiaSwitch"
            checked={dyslexiaMode}
            onChange={e => setDyslexiaMode(e.target.checked)}
            aria-describedby="dyslexia-desc"
            data-narrate={dyslexiaMode ? 'Dyslexia mode is on. Toggle to disable.' : 'Dyslexia mode is off. Toggle to enable.'}
          />
          <label className="form-check-label small fw-medium text-secondary" htmlFor="dyslexiaSwitch">
            Dyslexia Mode
          </label>
          <span id="dyslexia-desc" className="visually-hidden">
            Switches to a dyslexia-friendly font
          </span>
        </div>

        {/* Narration toggle */}
        <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="narrationSwitch"
            checked={narrationEnabled}
            onChange={toggleNarration}
            data-narrate={narrationEnabled ? 'Narration is on. Toggle to disable.' : 'Narration is off. Toggle to enable.'}
            aria-label={narrationEnabled ? 'Narration on. Toggle to disable.' : 'Narration off. Toggle to enable.'}
          />
          <label className="form-check-label small fw-medium text-secondary" htmlFor="narrationSwitch">
            🔊 Narration
          </label>
        </div>

        {/* Blind mode button */}
        {!isBlindMode ? (
          <button
            className="btn btn-sm btn-outline-primary rounded-pill"
            onClick={enableBlindMode}
            data-narrate="Enable full blind accessibility mode"
            aria-label="Enable full blind accessibility mode with keyboard navigation and automatic narration"
          >
            ♿ Blind Mode
          </button>
        ) : (
          <span
            className="badge bg-primary rounded-pill"
            aria-label={`Blind mode active. Reading speed ${rate.toFixed(1)}x`}
            data-narrate={`Blind mode active. Speed ${rate.toFixed(1)}x`}
          >
            ♿ On · {rate.toFixed(1)}×
          </span>
        )}

        {/* Keyboard shortcuts */}
        {(isBlindMode || narrationEnabled) && onShowHelp && (
          <button
            className="btn btn-sm btn-outline-secondary rounded-pill"
            onClick={onShowHelp}
            data-narrate="Keyboard shortcuts. Press to see all shortcuts."
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            ⌨️ Shortcuts
          </button>
        )}

        {/* Notes badge */}
        {savedNotesCount > 0 && (
          <span
            className="badge bg-success rounded-pill"
            aria-label={`${savedNotesCount} voice note${savedNotesCount !== 1 ? 's' : ''} saved`}
            data-narrate={`${savedNotesCount} voice notes saved`}
          >
            📝 {savedNotesCount}
          </span>
        )}

        {/* Sign Out */}
        <button
          className="btn btn-sm btn-outline-danger rounded-pill"
          onClick={onLogout}
          data-narrate="Sign out button"
          aria-label="Sign out of adaptEd"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
