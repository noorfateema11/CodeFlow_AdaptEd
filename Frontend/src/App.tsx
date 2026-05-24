import React, { useState, useEffect } from 'react';
import './App.css';
// @ts-ignore
import Navbar from './components/Navbar';
// @ts-ignore
import Companion from './components/Companion';
// @ts-ignore
import PdfUploader from './components/PdfUploader';
// @ts-ignore
import AudioPlayer from './components/AudioPlayer';
// @ts-ignore
import NlpInsights from './components/NlpInsights';

import SkinLink from './components/SkinLink';
import BlindHUD from './components/BlindHUD';
import KeyboardHelp from './components/KeyboardHelp';
import OnboardingNarration from './components/OnboardingNarration';

import { useAccessibility } from './context/AccessibilityContext';
import { useKeyboardManager } from './hooks/useKeyboardManager';
import { useGlobalFocusNarration } from './hooks/useFocusNarration';

interface ExtendedWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}
const customBrowserWindow = window as unknown as ExtendedWindow;

interface NlpAnalysis {
  readabilityScore: number;
  keywords: string[];
  wordCount: number;
  complexSentenceCount: number;
  sdgs: { goal: number; label: string; hits: number }[];
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [disabilityType, setDisabilityType] = useState('none');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userName, setUserName] = useState('');

  const [dyslexiaMode, setDyslexiaMode] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [savedNotesCount, setSavedNotesCount] = useState(0);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [nlpAnalysis, setNlpAnalysis] = useState<NlpAnalysis | null>(null);
  const [audioDocumentId, setAudioDocumentId] = useState('');
  const [audioTitle, setAudioTitle] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const {
    isBlindMode,
    narrationEnabled,
    speak,
    enableBlindMode,
    loadDocument,
    paragraphs,
  } = useAccessibility();

  useKeyboardManager({ onShowHelp: () => setShowHelp(true) });
  useGlobalFocusNarration();

  useEffect(() => {
    const saved = localStorage.getItem('adapted_token');
    const savedName = localStorage.getItem('adapted_username');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
      if (savedName) setUserName(savedName);
    }
  }, []);

  useEffect(() => {
    const disability = localStorage.getItem('adapted_disability');
    if (disability === 'blind') enableBlindMode();
  }, [enableBlindMode]);

  const speakText = (text: string) => {
    if (narrationEnabled) speak(text);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = authMode === 'login'
        ? { email, password }
        : { name, email, password, disabilityType };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      if (authMode === 'login') {
        localStorage.setItem('adapted_token', data.token);
        if (data.name) {
          localStorage.setItem('adapted_username', data.name);
          setUserName(data.name);
        }
        if (data.disabilityType) {
          localStorage.setItem('adapted_disability', data.disabilityType);
          if (data.disabilityType === 'blind') enableBlindMode();
        }
        setToken(data.token);
        setIsLoggedIn(true);
      } else {
        // Save disability choice
        localStorage.setItem('adapted_disability', disabilityType);
        if (disabilityType === 'blind') enableBlindMode();
        setAuthMode('login');
        setAuthError('Registered! Please log in.');
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adapted_token');
    localStorage.removeItem('adapted_username');
    window.speechSynthesis.cancel();
    setToken(''); setIsLoggedIn(false);
    setAudioDocumentId(''); setAudioTitle('');
    setNlpAnalysis(null);
    loadDocument('Welcome to adaptEd! Upload a PDF to get AI-adapted content tailored to your accessibility needs.');
  };

  const handleAudioReady = (_url: string, docId: string, fileName: string) => {
    setAudioDocumentId(docId);
    setAudioTitle(fileName);
  };

  // ── Voice note
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isLoggedIn) return;
    // Only trigger voice note on Ctrl+Space 
    if (event.code !== 'Space' || !event.ctrlKey) return;
    event.preventDefault();

    const SR = customBrowserWindow.SpeechRecognition || customBrowserWindow.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    setVoiceInputText('Listening...');
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setVoiceInputText(t);
      setSavedNotesCount(p => p + 1);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);
    };
    rec.start();
  };

  if (!isLoggedIn) {
    return (
      <>
        <SkinLink />
        <div
          className="container-fluid bg-light-override min-vh-100 d-flex align-items-center justify-content-center py-5"
          role="main"
          id="main-content"
        >
          <div className="card p-4 shadow border-0 rounded-4" style={{ maxWidth: '420px', width: '100%' }}>
            <div className="text-center mb-4">
              <h1 className="fw-bolder text-success m-0 fs-2" aria-label="adaptEd — Empowering Inclusive Learning">
                adapt<span className="text-dark">Ed</span>
              </h1>
              <small className="text-muted">Empowering Inclusive Learning</small>
              <div className="mt-2 d-flex justify-content-center gap-2 flex-wrap">
                <span className="badge rounded-pill" style={{ background: '#C5192D', fontSize: '0.65rem' }}>SDG 4 · Quality Education</span>
                <span className="badge rounded-pill" style={{ background: '#DD1367', fontSize: '0.65rem' }}>SDG 10 · Reduced Inequalities</span>
              </div>
            </div>

            <div className="d-flex mb-4 border-bottom" role="tablist" aria-label="Authentication mode">
              <button
                role="tab"
                aria-selected={authMode === 'login'}
                data-narrate="Sign In tab"
                className={`btn btn-link text-decoration-none fw-medium px-3 pb-2 ${authMode === 'login' ? 'text-success border-bottom border-success border-2' : 'text-muted'}`}
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={authMode === 'register'}
                data-narrate="Register tab"
                className={`btn btn-link text-decoration-none fw-medium px-3 pb-2 ${authMode === 'register' ? 'text-success border-bottom border-success border-2' : 'text-muted'}`}
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} aria-label={authMode === 'login' ? 'Sign in form' : 'Register form'}>
              {authMode === 'register' && (
                <div className="mb-3">
                  <label className="form-label fw-medium text-secondary" htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-medium text-secondary" htmlFor="emailInput">Email</label>
                <input
                  id="emailInput"
                  type="email"
                  className="form-control rounded-3"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium text-secondary" htmlFor="passwordInput">Password</label>
                <input
                  id="passwordInput"
                  type="password"
                  className="form-control rounded-3"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
              {authMode === 'register' && (
                <div className="mb-4">
                  <label className="form-label fw-medium text-secondary" htmlFor="disabilitySelect">Accessibility Need</label>
                  <select
                    id="disabilitySelect"
                    className="form-select rounded-3"
                    value={disabilityType}
                    onChange={e => setDisabilityType(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="dyslexia">Dyslexia</option>
                    <option value="blind">Blind / Low Vision</option>
                    <option value="deaf">Deaf / Hard of Hearing</option>
                    <option value="visual-learning">Visual Learner</option>
                  </select>
                </div>
              )}
              {authError && (
                <div
                  role="alert"
                  className={`alert py-2 px-3 small rounded-3 mb-3 ${authError.includes('Registered') ? 'alert-success' : 'alert-danger'}`}
                >
                  {authError}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-success btn-lg w-100 rounded-3 fw-medium shadow-sm"
                disabled={authLoading}
                data-narrate={authMode === 'login' ? 'Sign in button' : 'Create account button'}
              >
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SkinLink />

      {/* Onboarding narration fires once on login */}
      <OnboardingNarration trigger={isLoggedIn} userName={userName} />

      {/* Keyboard shortcuts modal */}
      <KeyboardHelp open={showHelp} onClose={() => setShowHelp(false)} />

      {/* Blind mode HUD */}
      <BlindHUD onShowHelp={() => setShowHelp(true)} />

      <div
        className={`container-fluid bg-light-override min-vh-100 py-4 ${dyslexiaMode ? 'dyslexia-mode' : ''}`}
        onKeyDown={handleKeyDown}
      >
        <div className="container">
          <Navbar
            voiceMode={narrationEnabled}
            setVoiceMode={(v: boolean) => v ? enableBlindMode() : undefined}
            dyslexiaMode={dyslexiaMode}
            setDyslexiaMode={setDyslexiaMode}
            savedNotesCount={savedNotesCount}
            onLogout={handleLogout}
            isBlindMode={isBlindMode}
            onShowHelp={() => setShowHelp(true)}
          />

          <main id="main-content">
            <PdfUploader
              setDocumentText={(text: string) => loadDocument(text, audioDocumentId)}
              speakText={speakText}
              token={token}
              onAudioReady={handleAudioReady}
              onNlpAnalysis={setNlpAnalysis}
              onDocumentLoaded={(text: string, docId: string) => loadDocument(text, docId)}
            />

            {nlpAnalysis && <NlpInsights analysis={nlpAnalysis} />}

            {audioDocumentId && (
              <div className="mb-4">
                <AudioPlayer
                  text={paragraphs.join('\n\n')}
                  title={audioTitle}
                  subtitle="Audio Summary"
                  documentId={audioDocumentId}
                  token={token}
                />
              </div>
            )}

            <Companion
              voiceInputText={voiceInputText}
              isFlashing={isFlashing}
              speakText={speakText}
            />
          </main>
        </div>
      </div>
    </>
  );
}
