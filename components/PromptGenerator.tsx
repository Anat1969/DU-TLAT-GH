/**
 * components/PromptGenerator.tsx
 *
 * Layout: RTL, compact, two-column
 * Right: form (essential fields highlighted, operative fields grouped)
 * Left: image frame + output
 */

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ImageUpload = dynamic(() => import('./ImageUpload'), { ssr: false });
const Model3DViewer = dynamic(() => import('./Model3DViewer'), { ssr: false });
const DepthViewer = dynamic(() => import('./DepthViewer'), { ssr: false });

interface ConceptInput {
  title: string;
  description: string;
  essence: string;
  tension: string;
  medium: string;
  style: string;
  references: string;
}

interface GeneratedPrompt {
  interpretation: string;
  prompt: string;
  timestamp: string;
}

const INITIAL_CONCEPT: ConceptInput = {
  title: '',
  description: '',
  essence: '',
  tension: '',
  medium: '',
  style: '',
  references: '',
};

export default function PromptGenerator() {
  const [concept, setConcept] = useState<ConceptInput>(() => {
    if (typeof window === 'undefined') return INITIAL_CONCEPT;
    try {
      const saved = localStorage.getItem('conceptInput');
      return saved ? JSON.parse(saved) : INITIAL_CONCEPT;
    } catch {
      return INITIAL_CONCEPT;
    }
  });

  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [depthImage, setDepthImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('conceptInput', JSON.stringify(concept));
  }, [concept]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof ConceptInput
  ) => {
    setConcept((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: concept.title,
          description: concept.description,
          essence: concept.essence,
          tension: concept.tension,
          medium: concept.medium,
          style: concept.style,
          references: concept.references.split(',').map((r) => r.trim()).filter((r) => r),
        }),
      });
      if (!response.ok) throw new Error('Failed to generate prompt');
      const data = await response.json();
      if (data.success) {
        setPrompt({
          interpretation: data.data.interpretation,
          prompt: data.data.prompt,
          timestamp: data.data.timestamp,
        });
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGenerate = concept.title && concept.description && concept.essence && concept.tension && concept.medium && concept.style;

  return (
    <div dir="rtl" style={styles.page}>
      {/* ===== HEADER ===== */}
      <header style={styles.header}>
        <h1 style={styles.logo}>DU-TLAT</h1>
        <p style={styles.tagline}>
          מרעיון לפרומפט. מתמונה למודל תלת-מימדי.
          <br />
          <span style={styles.taglineSub}>זקק את הקונספט שלך לשפה ויזואלית מדויקת</span>
        </p>
      </header>

      {/* ===== MAIN LAYOUT: form right, image left ===== */}
      <div style={styles.mainLayout}>

        {/* ===== RIGHT COLUMN: FORM ===== */}
        <div style={styles.formColumn}>

          {/* Essential fields - highlighted */}
          <div style={styles.essentialBlock}>
            <div style={styles.blockLabel}>עיקרי</div>

            <div style={styles.fieldCompact}>
              <label style={styles.labelEssential}>שם הרעיון</label>
              <input
                type="text"
                placeholder="התגעגעות למעצור שלא קיים"
                value={concept.title}
                onChange={(e) => handleInputChange(e, 'title')}
                style={styles.inputEssential}
              />
            </div>

            <div style={styles.fieldCompact}>
              <label style={styles.labelEssential}>הגרעין</label>
              <input
                type="text"
                placeholder="משפט אחד שתופס את הרעיון"
                value={concept.essence}
                onChange={(e) => handleInputChange(e, 'essence')}
                style={styles.inputEssential}
              />
            </div>

            <div style={styles.fieldCompact}>
              <label style={styles.labelEssential}>הניגוד / המתח</label>
              <input
                type="text"
                placeholder="אור ↔ צל, סדר ↔ כאוס"
                value={concept.tension}
                onChange={(e) => handleInputChange(e, 'tension')}
                style={styles.inputEssential}
              />
            </div>
          </div>

          {/* Operative fields - subtle */}
          <div style={styles.operativeBlock}>
            <div style={styles.blockLabelOp}>אופרטיבי</div>

            <div style={styles.fieldCompact}>
              <label style={styles.labelOp}>מקור השראה</label>
              <textarea
                placeholder="מתמטיקה, ביומימטיקה, תרבות..."
                value={concept.description}
                onChange={(e) => handleInputChange(e, 'description')}
                style={styles.textareaOp}
                rows={2}
              />
            </div>

            <div style={styles.twoCol}>
              <div style={styles.fieldCompact}>
                <label style={styles.labelOp}>מדיום</label>
                <input
                  type="text"
                  placeholder="מרחב, מבנה, פרטים"
                  value={concept.medium}
                  onChange={(e) => handleInputChange(e, 'medium')}
                  style={styles.inputOp}
                />
              </div>
              <div style={styles.fieldCompact}>
                <label style={styles.labelOp}>סגנון</label>
                <input
                  type="text"
                  placeholder="minimalist, organic"
                  value={concept.style}
                  onChange={(e) => handleInputChange(e, 'style')}
                  style={styles.inputOp}
                />
              </div>
            </div>

            <div style={styles.fieldCompact}>
              <label style={styles.labelOp}>אינספירציות (אופציונלי)</label>
              <input
                type="text"
                placeholder="בקט, אור זהוב, בטון בשחיקה"
                value={concept.references}
                onChange={(e) => handleInputChange(e, 'references')}
                style={styles.inputOp}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
            style={{
              ...styles.generateBtn,
              opacity: loading || !canGenerate ? 0.4 : 1,
            }}
          >
            {loading ? '... יוצר פרומפט' : 'יצור Prompt'}
          </button>

          {error && <div style={styles.error}>{error}</div>}

          {/* Output below form */}
          {prompt && (
            <div style={styles.outputSection}>
              <p style={styles.interpretation}>{prompt.interpretation}</p>
              <div style={styles.promptBox}>
                <p style={styles.promptText}>{prompt.prompt}</p>
              </div>
              <button
                onClick={() => copyToClipboard(prompt.prompt)}
                style={styles.copyBtn}
              >
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>
          )}
        </div>

        {/* ===== LEFT COLUMN: TWO FRAMES ===== */}
        <div style={styles.imageColumn}>
          {/* Frame 1: Image */}
          <div style={styles.framedBox}>
            <div style={styles.frameTitle}>תמונת המחשה</div>
            <ImageUpload
              onModel3D={setModelUrl}
              onImageReady={setUploadedImage}
              onDepth3D={(img) => { setDepthImage(img); setModelUrl(null); }}
            />
          </div>

          {/* Frame 2: 3D Model */}
          <div style={styles.framedBox}>
            <div style={styles.frameTitle}>מודל תלת-מימדי</div>
            {modelUrl ? (
              <Model3DViewer modelUrl={modelUrl} />
            ) : depthImage && uploadedImage ? (
              <DepthViewer imageBase64={uploadedImage} depthBase64={depthImage} />
            ) : (
              <div style={styles.model3dEmpty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <p style={styles.model3dEmptyText}>
                  העלה תמונה למעלה ומודל 3D יופיע כאן
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== STYLES =====

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '24px 40px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#111',
    lineHeight: 1.5,
    minHeight: '100vh',
  },

  // Header
  header: {
    textAlign: 'right',
    marginBottom: '28px',
    paddingBottom: '20px',
    borderBottom: '2px solid #111',
  },
  logo: {
    fontSize: '42px',
    fontWeight: 700,
    margin: '0 0 6px 0',
    letterSpacing: '-1px',
  },
  tagline: {
    fontSize: '17px',
    color: '#444',
    margin: 0,
    lineHeight: 1.6,
  },
  taglineSub: {
    fontSize: '14px',
    color: '#888',
  },

  // Main layout
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'start',
  },

  // Form column (right in RTL)
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },

  // Essential block
  essentialBlock: {
    position: 'relative' as const,
    border: '2px solid #111',
    borderRadius: '8px',
    padding: '20px 18px 14px',
    marginBottom: '16px',
    backgroundColor: '#fafafa',
  },
  blockLabel: {
    position: 'absolute' as const,
    top: '-11px',
    right: '16px',
    backgroundColor: '#fafafa',
    padding: '0 8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#111',
    letterSpacing: '1px',
  },

  // Operative block
  operativeBlock: {
    position: 'relative' as const,
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px 18px 14px',
    marginBottom: '16px',
    backgroundColor: '#fff',
  },
  blockLabelOp: {
    position: 'absolute' as const,
    top: '-11px',
    right: '16px',
    backgroundColor: '#fff',
    padding: '0 8px',
    fontSize: '12px',
    fontWeight: 400,
    color: '#999',
    letterSpacing: '0.5px',
  },

  // Fields
  fieldCompact: {
    marginBottom: '14px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },

  // Essential labels/inputs
  labelEssential: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px',
    color: '#111',
  },
  inputEssential: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #111',
    borderRadius: '4px',
    fontSize: '16px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },

  // Operative labels/inputs
  labelOp: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 400,
    marginBottom: '4px',
    color: '#777',
  },
  inputOp: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '15px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    color: '#333',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textareaOp: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '15px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    color: '#333',
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },

  // Generate button
  generateBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginBottom: '12px',
  },

  error: {
    padding: '10px',
    backgroundColor: '#fff0f0',
    border: '1px solid #c00',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#c00',
    textAlign: 'right' as const,
    marginBottom: '12px',
  },

  // Output
  outputSection: {
    borderTop: '1px solid #ddd',
    paddingTop: '14px',
    marginTop: '4px',
  },
  interpretation: {
    fontSize: '15px',
    color: '#555',
    lineHeight: 1.7,
    margin: '0 0 10px 0',
  },
  promptBox: {
    backgroundColor: '#f5f5f0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '14px',
    marginBottom: '8px',
    maxHeight: '160px',
    overflow: 'auto',
  },
  promptText: {
    fontSize: '15px',
    lineHeight: 1.7,
    margin: 0,
    color: '#111',
    fontFamily: '"Courier New", monospace',
    direction: 'ltr' as const,
    textAlign: 'left' as const,
  },
  copyBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid #111',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  // Image column (left in RTL)
  imageColumn: {
    position: 'sticky' as const,
    top: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  framedBox: {
    position: 'relative' as const,
    border: '2px solid #111',
    borderRadius: '8px',
    padding: '28px 16px 16px',
    backgroundColor: '#fafafa',
  },
  frameTitle: {
    position: 'absolute' as const,
    top: '-12px',
    right: '16px',
    backgroundColor: '#fafafa',
    padding: '0 10px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#111',
  },
  model3dEmpty: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    opacity: 0.5,
  },
  model3dEmptyText: {
    fontSize: '14px',
    color: '#999',
    margin: '12px 0 0',
    textAlign: 'center' as const,
  },
};
