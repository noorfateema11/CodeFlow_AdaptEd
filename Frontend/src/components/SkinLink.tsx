/**
 * SkipLink.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * DROP-IN: src/components/SkipLink.tsx
 *
 * Renders a visually-hidden "Skip to main content" link that becomes visible
 * on focus. Critical for keyboard-only / blind users to bypass the navbar.
 *
 * Usage:
 *   <SkipLink />
 *   ...
 *   <main id="main-content">...</main>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

export default function SkipLink() {
  return (
    <>
      <style>{`
        .skip-link {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10001;
          background: #4a3d9a;
          color: #fff;
          padding: 10px 20px;
          border-radius: 0 0 10px 10px;
          font-family: 'Atkinson Hyperlegible', 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          transition: top 0.15s ease;
          outline: none;
        }
        .skip-link:focus {
          top: 0;
          outline: 3px solid #e6a817;
          outline-offset: 2px;
        }
      `}</style>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
    </>
  );
}
