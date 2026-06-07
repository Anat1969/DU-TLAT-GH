'use client';

import React, { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  onImageReady?: (base64: string) => void;
  onModel3D?: (modelUrl: string) => void;
}

export default function ImageUpload({ onImageReady, onModel3D }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('בחר תמונה בלבד (JPG, PNG)');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('תמונה גדולה מדי (מקסימום 4MB)');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      onImageReady?.(base64);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageReady]);

  // File input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImage(file);
  };

  // Paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImage(file);
          return;
        }
      }
    }
  }, [handleImage]);

  const processImage = async (imageBase64: string) => {
    setLoading(true);
    setStep('analyzing');
    setError('');
    try {
      const visionRes = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const visionData = await visionRes.json();
      if (!visionRes.ok) throw new Error(visionData.error || 'Failed to analyze image');

      setStep('generating');
      const gen3dRes = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: visionData.prompt }),
      });
      const gen3dData = await gen3dRes.json();
      if (!gen3dRes.ok) throw new Error(gen3dData.error || 'Failed to generate 3D');

      pollForModel(gen3dData.taskId);
    } catch (err: any) {
      setError(err.message || 'שגיאה בעיבוד התמונה');
      setLoading(false);
      setStep('');
    }
  };

  const pollForModel = async (taskId: string) => {
    let attempts = 0;
    const poll = async () => {
      attempts++;
      if (attempts > 120) {
        setError('Timeout');
        setLoading(false);
        setStep('');
        return;
      }
      try {
        const res = await fetch(`/api/generate-3d?taskId=${taskId}`);
        const data = await res.json();
        if (data.status === 'completed' && data.modelUrl) {
          setLoading(false);
          setStep('');
          onModel3D?.(data.modelUrl);
        } else if (data.status === 'failed') {
          setError('יצירת מודל 3D נכשלה');
          setLoading(false);
          setStep('');
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        setTimeout(poll, 2000);
      }
    };
    poll();
  };

  return (
    <div
      style={{
        ...s.dropZone,
        borderColor: isDragOver ? '#111' : '#ccc',
        backgroundColor: isDragOver ? '#f0f0f0' : '#fafafa',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={() => !preview && inputRef.current?.click()}
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
        style={{ display: 'none' }}
      />

      {!preview && !loading && (
        <div style={s.placeholder}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p style={s.placeholderMain}>גרור תמונה לכאן</p>
          <p style={s.placeholderSub}>או לחץ לבחור | או הדבק (Ctrl+V)</p>
        </div>
      )}

      {preview && (
        <img
          src={preview}
          alt="preview"
          style={s.previewImg}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        />
      )}

      {loading && (
        <div style={s.statusOverlay}>
          <div style={s.spinner} />
          <p style={s.statusText}>
            {step === 'analyzing' ? 'מנתח תמונה...' : 'יוצר מודל 3D...'}
          </p>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}
    </div>
  );
}

const s: { [key: string]: React.CSSProperties } = {
  dropZone: {
    width: '100%',
    minHeight: '280px',
    border: '2px dashed #ccc',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background-color 0.2s',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
  },
  placeholder: {
    textAlign: 'center',
    padding: '20px',
  },
  placeholderMain: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#888',
    margin: '12px 0 4px',
  },
  placeholderSub: {
    fontSize: '13px',
    color: '#bbb',
    margin: 0,
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    cursor: 'pointer',
  },
  statusOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #ddd',
    borderTop: '3px solid #111',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  statusText: {
    fontSize: '14px',
    color: '#555',
    margin: 0,
  },
  error: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    right: '8px',
    padding: '8px',
    backgroundColor: '#fff0f0',
    border: '1px solid #c00',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#c00',
    textAlign: 'center',
  },
};
