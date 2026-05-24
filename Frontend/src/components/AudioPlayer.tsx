

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface AudioPlayerProps {
  text: string;
  title: string;
  subtitle?: string;
  documentId?: string;
  token?: string;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const WORDS_PER_SEC = 150 / 60;

export default function AudioPlayer({ text, title, subtitle, documentId, token }: AudioPlayerProps) {
  const { rate, narrationEnabled } = useAccessibility();

  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const estimatedDuration = Math.ceil(totalWords / (WORDS_PER_SEC * rate));

  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const currentTime = Math.round(wordIndex / (WORDS_PER_SEC * rate));
  const progress = totalWords > 0 ? (wordIndex / totalWords) * 100 : 0;

  // Load saved progress
  useEffect(() => {
    if (!documentId || !token) return;
    fetch(`/api/audio/progress/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.currentTime) {
          setWordIndex(Math.min(Math.round(data.currentTime * WORDS_PER_SEC), totalWords));
        }
      })
      .catch(() => {});
  }, [documentId, token]); // eslint-disable-line

  const saveProgress = useCallback((wIdx: number) => {
    if (!documentId || !token) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/audio/progress/${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentTime: Math.round(wIdx / WORDS_PER_SEC), duration: estimatedDuration }),
      }).catch(() => {});
    }, 2000);
  }, [documentId, token, estimatedDuration]);

  useEffect(() => () => {
    window.speechSynthesis.cancel();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const speakFrom = useCallback((startWord: number) => {
    window.speechSynthesis.cancel();
    if (startWord >= totalWords) { setWordIndex(totalWords); setIsPlaying(false); return; }
    const remaining = words.slice(startWord).join(' ');
    const utt = new SpeechSynthesisUtterance(remaining);
    utt.rate = rate;
    utt.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== 'word') return;
      const spoken = remaining.slice(0, e.charIndex).trim().split(/\s+/).filter(Boolean).length;
      const current = startWord + spoken;
      setWordIndex(current);
      saveProgress(current);
    };
    utt.onend = () => { setWordIndex(totalWords); setIsPlaying(false); saveProgress(totalWords); };
    utt.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
  }, [words, totalWords, saveProgress, rate]);

  const handlePlay = () => {
    if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); }
    else speakFrom(wordIndex >= totalWords ? 0 : wordIndex);
  };
  const handleRestart = () => { window.speechSynthesis.cancel(); setWordIndex(0); setIsPlaying(false); };
  const handleSkipBack = () => {
    const n = Math.max(0, wordIndex - Math.round(10 * WORDS_PER_SEC));
    window.speechSynthesis.cancel(); setWordIndex(n);
    if (isPlaying) speakFrom(n);
  };
  const handleSkipForward = () => {
    const n = Math.min(totalWords, wordIndex + Math.round(10 * WORDS_PER_SEC));
    window.speechSynthesis.cancel(); setWordIndex(n);
    if (isPlaying) speakFrom(n);
  };
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const n = Math.round(ratio * totalWords);
    window.speechSynthesis.cancel(); setWordIndex(n);
    if (isPlaying) speakFrom(n);
    saveProgress(n);
  };

  return (
    <>
      <style>{`
        .ap{background:#eeeaff;border:1.5px solid #c8c0f0;border-radius:16px;padding:16px 20px 14px;color:#2a2260;font-family:'Atkinson Hyperlegible','Nunito','Segoe UI',sans-serif;box-shadow:0 2px 12px rgba(107,94,168,.10)}
        .ap-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .ap-title{font-size:.82rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;color:#2a2260}
        .ap-subtitle{font-size:.68rem;color:#6b5ea8;letter-spacing:.07em;text-transform:uppercase;margin-top:2px}
        .ap-controls{display:flex;align-items:center;gap:2px}
        .ap-btn{background:none;border:none;cursor:pointer;color:#4a3d9a;padding:6px;border-radius:8px;display:flex;align-items:center;justify-content:center;min-width:36px;min-height:36px;transition:color .15s,background .15s}
        .ap-btn:hover{color:#2a2260;background:rgba(74,61,154,.12)}
        .ap-btn:focus-visible{outline:3px solid #e6a817;outline-offset:2px}
        .ap-btn-play{width:38px;height:38px;background:#4a6fa5!important;border-radius:50%!important;color:#fff!important;margin:0 4px}
        .ap-btn-play:hover{background:#3a5a8c!important}
        .ap-btn-speed{background:rgba(74,61,154,.08)!important;border:1px solid rgba(74,61,154,.2)!important;color:#4a3d9a!important;border-radius:6px!important;font-size:.72rem;padding:3px 8px!important}
        .ap-progress-wrap{position:relative;height:22px;display:flex;align-items:center;cursor:pointer;margin-bottom:2px}
        .ap-track{position:absolute;left:0;right:0;height:4px;background:#c8c0f0;border-radius:4px}
        .ap-fill{height:100%;background:#4a6fa5;border-radius:4px;transition:width .35s linear}
        .ap-thumb{position:absolute;width:12px;height:12px;background:#4a6fa5;border:2px solid #fff;border-radius:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(74,61,154,.25);transition:left .35s linear;pointer-events:none}
        .ap-times{display:flex;justify-content:space-between;font-size:.68rem;color:#6b5ea8;font-variant-numeric:tabular-nums;letter-spacing:.02em;margin-bottom:10px}
        .ap-footer{display:flex;align-items:center;gap:8px;background:rgba(74,61,154,.07);border-radius:8px;padding:6px 10px}
        .ap-pip{width:6px;height:6px;border-radius:50%;background:#4a6fa5;flex-shrink:0}
        .ap-pip.paused{background:#c8c0f0}
        .ap-pip.playing{animation:pip 1.8s ease-in-out infinite}
        @keyframes pip{0%,100%{opacity:1}50%{opacity:.3}}
        @media(prefers-reduced-motion:reduce){.ap-pip.playing{animation:none}}
        .ap-footer-text{font-size:.68rem;color:#6b5ea8;letter-spacing:.02em}
        .ap-footer-words{margin-left:auto;font-size:.65rem;color:#9b8fd4;font-variant-numeric:tabular-nums}
      `}</style>

      <div className="ap" role="region" aria-label={`Audio player: ${title}`}>
        <div className="ap-header">
          <div>
            <div className="ap-title">{title || 'Document'}</div>
            {subtitle && <div className="ap-subtitle">{subtitle}</div>}
          </div>
          <div className="ap-controls">
            {/* Speed controls */}
            <button
              className="ap-btn ap-btn-speed"
              onClick={() => { window.speechSynthesis.cancel(); const n = Math.max(0.5, rate - 0.25); speakFrom(wordIndex); }}
              aria-label={`Decrease speed, currently ${rate.toFixed(1)}x`}
              data-narrate={`Decrease speed, currently ${rate.toFixed(1)}x`}
              title="Decrease speed (−)"
            >
              −
            </button>
            <span
              style={{ fontSize: '.72rem', color: '#4a3d9a', minWidth: 32, textAlign: 'center' }}
              aria-live="polite"
              aria-label={`Reading speed ${rate.toFixed(1)}x`}
            >
              {rate.toFixed(1)}×
            </span>
            <button
              className="ap-btn ap-btn-speed"
              onClick={() => { window.speechSynthesis.cancel(); speakFrom(wordIndex); }}
              aria-label={`Increase speed, currently ${rate.toFixed(1)}x`}
              data-narrate={`Increase speed, currently ${rate.toFixed(1)}x`}
              title="Increase speed (+)"
            >
              +
            </button>

            <button className="ap-btn" onClick={handleRestart} aria-label="Restart from beginning" data-narrate="Restart" title="Restart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
            </button>
            <button className="ap-btn" onClick={handleSkipBack} aria-label="Skip back 10 seconds" data-narrate="Back 10 seconds" title="Back 10s">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button
              className="ap-btn ap-btn-play"
              onClick={handlePlay}
              aria-label={isPlaying ? 'Pause playback' : 'Play document'}
              data-narrate={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button className="ap-btn" onClick={handleSkipForward} aria-label="Skip forward 10 seconds" data-narrate="Forward 10 seconds" title="Forward 10s">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm8-12v12h2V6h-2z"/></svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div
          ref={progressBarRef}
          className="ap-progress-wrap"
          onClick={handleScrub}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={estimatedDuration}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(estimatedDuration)}`}
          aria-label="Playback position"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') handleSkipForward();
            if (e.key === 'ArrowLeft') handleSkipBack();
          }}
        >
          <div className="ap-track">
            <div className="ap-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="ap-thumb" style={{ left: `${progress}%` }} />
        </div>

        <div className="ap-times">
          <span aria-hidden="true">{formatTime(currentTime)}</span>
          <span aria-hidden="true">~{formatTime(estimatedDuration)}</span>
        </div>

        <div className="ap-footer">
          <div className={`ap-pip${isPlaying ? ' playing' : ' paused'}`} aria-hidden="true" />
          <span className="ap-footer-text" aria-live="polite">
            {Math.round(progress)}% — {formatTime(currentTime)} of ~{formatTime(estimatedDuration)}
          </span>
          <span className="ap-footer-words" aria-hidden="true">{wordIndex} / {totalWords} words</span>
        </div>
      </div>
    </>
  );
}
