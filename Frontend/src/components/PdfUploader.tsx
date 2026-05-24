import React, { useState, useRef, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface NlpAnalysis {
  readabilityScore: number;
  keywords: string[];
  wordCount: number;
  complexSentenceCount: number;
  sdgs: { goal: number; label: string; hits: number }[];
}

interface PdfUploaderProps {
  setDocumentText: (text: string) => void;
  speakText: (text: string) => void;
  token: string;
  onAudioReady?: (audioUrl: string, documentId: string, fileName: string) => void;
  onNlpAnalysis?: (analysis: NlpAnalysis) => void;
  onDocumentLoaded?: (text: string, docId: string) => void;
}

export default function PdfUploader({
  setDocumentText,
  token,
  onAudioReady,
  onNlpAnalysis,
  onDocumentLoaded,
}: PdfUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { speak, speakFocus, isBlindMode } = useAccessibility();

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        const msg = 'Please select a PDF file.';
        setError(msg);
        if (isBlindMode) speak(msg);
        return;
      }

      setError('');
      setIsLoading(true);
      const readingMsg = `Reading ${file.name}. Please wait.`;
      setStatusMessage(readingMsg);
      if (isBlindMode) speak(readingMsg);

      try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch('/api/pdf/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const resultText = data.content || 'PDF processed.';
          const docId = data.documentId ?? file.name;

          setDocumentText(resultText);
          if (onDocumentLoaded) onDocumentLoaded(resultText, docId);
          if (data.nlpAnalysis && onNlpAnalysis) onNlpAnalysis(data.nlpAnalysis);
          if (onAudioReady) onAudioReady(data.audioUrl ?? '', docId, file.name.replace('.pdf', ''));

          const successMsg = `${file.name} uploaded successfully. Document is ready to read.`;
          setStatusMessage(`✅ "${file.name}" processed.`);
          if (isBlindMode) speak(successMsg);
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Upload failed.');
        }
      } catch (err: any) {
        const errMsg = err.message || 'Something went wrong.';
        setError(errMsg);
        if (isBlindMode) speak(`Error: ${errMsg}`);
      }

      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [token, isBlindMode, speak, setDocumentText, onAudioReady, onNlpAnalysis, onDocumentLoaded]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and drop
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Keyboard trigger
  const handleDropZoneKey = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
      <h5 className="fw-semibold text-secondary mb-3" id="upload-heading">
        📄 Upload PDF
      </h5>

      {/* ARIA*/}
      <div aria-live="polite" aria-atomic="true" className="visually-hidden">
        {statusMessage || error}
      </div>

      <label
        htmlFor="pdfInput"
        aria-labelledby="upload-heading"
        aria-describedby="upload-hint"
        data-narrate="Upload PDF drop zone. Press Enter or Space to choose a file."
        className="d-flex flex-column align-items-center justify-content-center border border-2 border-dashed rounded-3 p-4 text-center"
        style={{
          borderColor: '#adb5bd',
          minHeight: 130,
          cursor: isLoading ? 'default' : 'pointer',
          outline: 'none',
        }}
        tabIndex={0}
        role="button"
        aria-busy={isLoading}
        onKeyDown={handleDropZoneKey}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onFocus={() => speakFocus('Upload PDF drop zone. Press Enter or Space to choose a file.')}
      >
        {isLoading ? (
          <div className="spinner-border text-success" role="status" aria-label="Uploading PDF..." />
        ) : (
          <>
            <span style={{ fontSize: '2rem' }} aria-hidden="true">📂</span>
            <span className="text-muted small mt-2">Click or press Enter to choose a PDF (max 10 MB)</span>
          </>
        )}
      </label>

      <span id="upload-hint" className="visually-hidden">
        Accepts PDF files up to 10 megabytes. After upload, the document will be read aloud automatically.
      </span>

      <input
        ref={fileInputRef}
        id="pdfInput"
        type="file"
        accept="application/pdf"
        className="d-none"
        onChange={handleFileChange}
        disabled={isLoading}
        aria-hidden="true"
        tabIndex={-1}
      />

      {statusMessage && (
        <p className="text-success small mt-2 mb-0" role="status">
          {statusMessage}
        </p>
      )}
      {error && (
        <p className="text-danger small mt-2 mb-0" role="alert">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
