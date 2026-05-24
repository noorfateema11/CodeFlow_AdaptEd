import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
export interface Bookmark {
  paragraphIndex: number;
  label: string;
  createdAt: number;
}

export interface AccessibilityState {
  isBlindMode: boolean;
  narrationEnabled: boolean;
  rate: number;
  paragraphs: string[];
  currentParagraph: number;
  isSpeaking: boolean;
  isPaused: boolean;
  bookmarks: Bookmark[];
  documentId: string;

  speak: (text: string, priority?: boolean) => void;
  speakFocus: (text: string) => void;
  speakQueued: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (r: number) => void;
  toggleNarration: () => void;
  enableBlindMode: () => void;
  loadDocument: (text: string, docId?: string) => void;
  goToParagraph: (index: number) => void;
  nextParagraph: () => void;
  prevParagraph: () => void;
  readCurrentParagraph: () => void;
  addBookmark: (label?: string) => void;
  goToBookmark: (index: number) => void;
  removeBookmark: (paragraphIndex: number) => void;
}
const noop = () => {};

const defaultCtx: AccessibilityState = {
  isBlindMode: false,
  narrationEnabled: false,
  rate: 1,
  paragraphs: [],
  currentParagraph: 0,
  isSpeaking: false,
  isPaused: false,
  bookmarks: [],
  documentId: '',
  speak: noop,
  speakFocus: noop,
  speakQueued: noop,
  pause: noop,
  resume: noop,
  stop: noop,
  setRate: noop,
  toggleNarration: noop,
  enableBlindMode: noop,
  loadDocument: noop,
  goToParagraph: noop,
  nextParagraph: noop,
  prevParagraph: noop,
  readCurrentParagraph: noop,
  addBookmark: noop,
  goToBookmark: noop,
  removeBookmark: noop,
};

export const AccessibilityContext = createContext<AccessibilityState>(defaultCtx);
export const useAccessibility = () => useContext(AccessibilityContext);

function splitIntoParagraphs(text: string): string[] {
  const byBlankLine = text
    .split(/\n{2,}/)
    .map(s => s.replace(/\n/g, ' ').trim())
    .filter(s => s.length > 10);

  if (byBlankLine.length > 1) return byBlankLine;

  const sentences = text.match(/[^.!?]+[.!?]+["']?/g) ?? [text];
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    chunks.push(sentences.slice(i, i + 3).join(' ').trim());
  }
  return chunks.filter(c => c.length > 5);
}

const LS_BOOKMARKS = (docId: string) => `adapted_bookmarks_${docId}`;
const LS_PROGRESS = (docId: string) => `adapted_progress_${docId}`;

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  const [rate, setRateState] = useState(1);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [documentId, setDocumentId] = useState('');

  const focusUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isFocusSpeakingRef = useRef(false);
  useEffect(() => {
    const disability = localStorage.getItem('adapted_disability');
    if (disability === 'blind') {
      setIsBlindMode(true);
      setNarrationEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!documentId) return;
    try {
      const saved = localStorage.getItem(LS_BOOKMARKS(documentId));
      if (saved) setBookmarks(JSON.parse(saved));
      else setBookmarks([]);

      const progress = localStorage.getItem(LS_PROGRESS(documentId));
      if (progress) {
        const idx = parseInt(progress, 10);
        if (!isNaN(idx)) setCurrentParagraph(idx);
      }
    } catch {
      setBookmarks([]);
    }
  }, [documentId]);

  const speak = useCallback(
    (text: string, priority = true) => {
      if (!narrationEnabled) return;
      if (priority) window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = rate;
      utt.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      utt.onend = () => { setIsSpeaking(false); setIsPaused(false); };
      utt.onerror = () => { setIsSpeaking(false); setIsPaused(false); };
      window.speechSynthesis.speak(utt);
    },
    [narrationEnabled, rate]
  );

  const speakFocus = useCallback(
    (text: string) => {
      if (!narrationEnabled || !isBlindMode) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = Math.min(rate * 1.1, 1.6); 
      utt.volume = 1;
      focusUtteranceRef.current = utt;
      isFocusSpeakingRef.current = true;
      utt.onend = () => { isFocusSpeakingRef.current = false; };
      utt.onerror = () => { isFocusSpeakingRef.current = false; };
      window.speechSynthesis.speak(utt);
    },
    [narrationEnabled, isBlindMode, rate]
  );

  const speakQueued = useCallback(
    (text: string) => {
      if (!narrationEnabled) return;
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = rate;
      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt); 
    },
    [narrationEnabled, rate]
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const setRate = useCallback((r: number) => {
    const clamped = Math.min(2, Math.max(0.5, r));
    setRateState(clamped);
    const utt = new SpeechSynthesisUtterance(`Speed: ${clamped.toFixed(1)}x`);
    utt.rate = clamped;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }, []);

  const toggleNarration = useCallback(() => {
    setNarrationEnabled(prev => {
      const next = !prev;
      if (!next) window.speechSynthesis.cancel();
      return next;
    });
  }, []);

  const enableBlindMode = useCallback(() => {
    setIsBlindMode(true);
    setNarrationEnabled(true);
    localStorage.setItem('adapted_disability', 'blind');
  }, []);

  
  const loadDocument = useCallback(
    (text: string, docId?: string) => {
      const paras = splitIntoParagraphs(text);
      setParagraphs(paras);
      if (docId) {
        setDocumentId(docId);
        const progress = localStorage.getItem(LS_PROGRESS(docId));
        const startIdx = progress ? parseInt(progress, 10) : 0;
        setCurrentParagraph(isNaN(startIdx) ? 0 : startIdx);
      } else {
        setCurrentParagraph(0);
      }
    },
    []
  );

  const goToParagraph = useCallback(
    (index: number) => {
      const idx = Math.max(0, Math.min(paragraphs.length - 1, index));
      setCurrentParagraph(idx);
      if (documentId) {
        localStorage.setItem(LS_PROGRESS(documentId), String(idx));
      }
    },
    [paragraphs.length, documentId]
  );

  const readCurrentParagraph = useCallback(() => {
    if (paragraphs[currentParagraph]) {
      speak(paragraphs[currentParagraph]);
    }
  }, [paragraphs, currentParagraph, speak]);

  const nextParagraph = useCallback(() => {
    const next = Math.min(paragraphs.length - 1, currentParagraph + 1);
    goToParagraph(next);
    if (paragraphs[next]) speak(paragraphs[next]);
  }, [currentParagraph, paragraphs, goToParagraph, speak]);

  const prevParagraph = useCallback(() => {
    const prev = Math.max(0, currentParagraph - 1);
    goToParagraph(prev);
    if (paragraphs[prev]) speak(paragraphs[prev]);
  }, [currentParagraph, paragraphs, goToParagraph, speak]);

  const addBookmark = useCallback(
    (label?: string) => {
      const bm: Bookmark = {
        paragraphIndex: currentParagraph,
        label: label ?? `Bookmark at paragraph ${currentParagraph + 1}`,
        createdAt: Date.now(),
      };
      setBookmarks(prev => {
        const exists = prev.some(b => b.paragraphIndex === currentParagraph);
        if (exists) return prev;
        const next = [...prev, bm];
        if (documentId) {
          localStorage.setItem(LS_BOOKMARKS(documentId), JSON.stringify(next));
        }
        return next;
      });
      speakFocus(`Bookmarked paragraph ${currentParagraph + 1}`);
    },
    [currentParagraph, documentId, speakFocus]
  );

  const goToBookmark = useCallback(
    (index: number) => {
      if (bookmarks[index]) {
        goToParagraph(bookmarks[index].paragraphIndex);
        speak(paragraphs[bookmarks[index].paragraphIndex] ?? '');
      }
    },
    [bookmarks, goToParagraph, paragraphs, speak]
  );

  const removeBookmark = useCallback(
    (paragraphIndex: number) => {
      setBookmarks(prev => {
        const next = prev.filter(b => b.paragraphIndex !== paragraphIndex);
        if (documentId) {
          localStorage.setItem(LS_BOOKMARKS(documentId), JSON.stringify(next));
        }
        return next;
      });
    },
    [documentId]
  );
  const value: AccessibilityState = {
    isBlindMode,
    narrationEnabled,
    rate,
    paragraphs,
    currentParagraph,
    isSpeaking,
    isPaused,
    bookmarks,
    documentId,
    speak,
    speakFocus,
    speakQueued,
    pause,
    resume,
    stop,
    setRate,
    toggleNarration,
    enableBlindMode,
    loadDocument,
    goToParagraph,
    nextParagraph,
    prevParagraph,
    readCurrentParagraph,
    addBookmark,
    goToBookmark,
    removeBookmark,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
