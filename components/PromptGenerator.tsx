/**
 * components/PromptGenerator.tsx
 *
 * ממשק לקלט קונספט ויצירת Midjourney Prompt
 * RTL, שחור-לבן, minimal
 */

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ImageUpload = dynamic(() => import('./ImageUpload'), { ssr: false });
const Model3DViewer = dynamic(() => import('./Model3DViewer'), { ssr: false });

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('conceptInput', JSON.stringify(concept));
  }, [concept]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof ConceptInput
  ) => {
    setConcept((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: concept.title,
          description: concept.description,
          essence: concept.essence,
          tension: concept.tension,
          medium: concept.medium,
          style: concept.style,
          references: concept.references
            .split(',')
            .map((r) => r.trim())
            .filter((r) => r),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

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
    alert('Prompt copied to clipboard');
  };

  return (
    <div dir="rtl" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>יוצר פרומפטים</h1>
        <p style={styles.subtitle}>
          זקק את הרעיון לפרומפט Midjourney מזוקק
        </p>
      </div>

      <div style={styles.mainGrid}>
        {/* Input Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>קלט קונספט</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>שם הרעיון</label>
            <input
              type="text"
              placeholder="e.g., התגעגעות למעצור שלא קיים"
              value={concept.title}
              onChange={(e) => handleInputChange(e, 'title')}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>תיאור מקור ההשראה</label>
            <textarea
              placeholder="מאיפה הרעיון בא? (מתמטיקה, ביומימטיקה, תרבות, וכו')"
              value={concept.description}
              onChange={(e) => handleInputChange(e, 'description')}
              style={{ ...styles.textarea, minHeight: '80px' }}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>הגרעין בעברית</label>
            <input
              type="text"
              placeholder="משפט אחד שתופס את הרעיון"
              value={concept.essence}
              onChange={(e) => handleInputChange(e, 'essence')}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>הניגוד / המתח</label>
            <input
              type="text"
              placeholder="e.g., אור ↔ צל, סדר ↔ כאוס"
              value={concept.tension}
              onChange={(e) => handleInputChange(e, 'tension')}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>המדיום</label>
            <input
              type="text"
              placeholder="מרחב מחייה, מבנה, פרטים, וכו'"
              value={concept.medium}
              onChange={(e) => handleInputChange(e, 'medium')}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>הסגנון</label>
            <input
              type="text"
              placeholder="minimalist, brutalist, organic, parametric"
              value={concept.style}
              onChange={(e) => handleInputChange(e, 'style')}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>אינספירציות (optional)</label>
            <textarea
              placeholder="בקט, אור זהוב, בטון בשחיקה (מופרדות בפסיק)"
              value={concept.references}
              onChange={(e) => handleInputChange(e, 'references')}
              style={{ ...styles.textarea, minHeight: '60px' }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={
              loading ||
              !concept.title ||
              !concept.description ||
              !concept.essence ||
              !concept.tension ||
              !concept.medium ||
              !concept.style
            }
            style={{
              ...styles.button,
              opacity:
                loading ||
                !concept.title ||
                !concept.description ||
                !concept.essence
                  ? 0.5
                  : 1,
            }}
          >
            {loading ? 'יוצר פרומפט...' : 'יצור Midjourney Prompt'}
          </button>

          {error && <div style={styles.error}>{error}</div>}
        </div>

        {/* Output Section */}
        {prompt && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Visual Prompt</h2>

            <div style={styles.outputBox}>
              <h3 style={styles.outputSubtitle}>פרשנות</h3>
              <p style={styles.outputText}>{prompt.interpretation}</p>
            </div>

            <div style={styles.outputBox}>
              <div style={styles.promptDisplay}>
                <p style={styles.promptText}>{prompt.prompt}</p>
              </div>
              <button
                onClick={() => copyToClipboard(prompt.prompt)}
                style={styles.copyButton}
              >
                Copy
              </button>
            </div>

            <div style={styles.meta}>
              <small>יצור: {new Date(prompt.timestamp).toLocaleString('he-IL')}</small>
            </div>

            <ImageUpload onModel3D={setModelUrl} />
            {modelUrl && <Model3DViewer modelUrl={modelUrl} />}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        <h3 style={styles.instructionsTitle}>הוראות:</h3>
        <ol style={styles.instructionsList}>
          <li>מלא את הקונספט בשדות מעל</li>
          <li>לחץ על "יצור Prompt" וחכה</li>
          <li>העתק את ה-Prompt לMidjourney וצור תמונה</li>
          <li>העלה את התמונה לאפליקציה</li>
          <li>Tripo3D תהפוך אותה ל-3D</li>
          <li>הכל יישמר בSupabase</li>
        </ol>
      </div>
    </div>
  );
}

// ★ STYLES (RTL, שחור-לבן, minimal)

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: '#ffffff',
    fontFamily: '"Shirahand", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#000000',
    lineHeight: 1.6,
  },

  header: {
    textAlign: 'right',
    marginBottom: '60px',
    borderBottom: '1px solid #000000',
    paddingBottom: '30px',
  },

  title: {
    fontSize: '32px',
    fontWeight: 'normal',
    margin: '0 0 10px 0',
    letterSpacing: '-0.5px',
  },

  subtitle: {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
    fontWeight: 'normal',
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '60px',
    marginBottom: '80px',
  },

  section: {
    padding: '0',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'normal',
    marginBottom: '30px',
    borderBottom: '1px solid #000000',
    paddingBottom: '15px',
    letterSpacing: '0.5px',
  },

  formGroup: {
    marginBottom: '35px',
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '12px',
  },

  label: {
    fontSize: '12px',
    fontWeight: 'normal',
    marginBottom: '8px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },

  input: {
    padding: '12px 0',
    border: 'none',
    borderBottom: '1px solid #000000',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#000000',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
  },

  textarea: {
    padding: '12px 0',
    border: 'none',
    borderBottom: '1px solid #000000',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#000000',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    transition: 'border-color 0.2s',
  },

  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    fontSize: '14px',
    fontWeight: 'normal',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'opacity 0.2s',
  },

  error: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #000000',
    fontSize: '13px',
    color: '#000000',
    textAlign: 'right',
  },

  outputBox: {
    marginBottom: '30px',
    paddingBottom: '25px',
    borderBottom: '1px solid #cccccc',
  },

  outputSubtitle: {
    fontSize: '13px',
    fontWeight: 'normal',
    marginBottom: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },

  outputText: {
    fontSize: '14px',
    lineHeight: 1.8,
    margin: 0,
    color: '#333333',
  },

  promptDisplay: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    border: '1px solid #cccccc',
    marginBottom: '12px',
    minHeight: '80px',
    maxHeight: '200px',
    overflow: 'auto',
  },

  promptText: {
    fontSize: '14px',
    lineHeight: 1.8,
    margin: 0,
    color: '#000000',
    fontFamily: '"Courier New", monospace',
  },

  copyButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #000000',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },

  meta: {
    marginTop: '15px',
    fontSize: '12px',
    color: '#999999',
    textAlign: 'right',
  },

  instructions: {
    backgroundColor: '#f9f9f9',
    padding: '30px',
    border: '1px solid #cccccc',
    textAlign: 'right',
  },

  instructionsTitle: {
    fontSize: '14px',
    fontWeight: 'normal',
    marginBottom: '15px',
    letterSpacing: '0.5px',
  },

  instructionsList: {
    fontSize: '13px',
    lineHeight: 2,
    margin: 0,
    paddingRight: '20px',
    color: '#333333',
  },

  model3dPlaceholder: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #cccccc',
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#666666',
  },
};
