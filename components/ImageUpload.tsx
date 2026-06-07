'use client';

import React, { useState, useRef, useCallback } from 'react';

type Engine = 'tripo' | 'stability' | 'fal' | 'depth';

interface EngineInfo {
  id: Engine;
  name: string;
  desc: string;
  credit: string;
  endpoint: string;
}

const ENGINES: EngineInfo[] = [
  {
    id: 'tripo',
    name: 'Tripo3D',
    desc: 'image → 3D model',
    credit: '300 קרדיטים/חודש חינם',
    endpoint: '/api/generate-3d',
  },
  {
    id: 'stability',
    name: 'Stability AI',
    desc: 'SF3D — מהיר (0.5 שניה)',
    credit: 'חינם למשתמשים קטנים',
    endpoint: '/api/generate-3d-stability',
  },
  {
    id: 'fal',
    name: 'fal.ai',
    desc: 'Hyper3D Rodin — איכות גבוהה',
    credit: '$20 חינם בהרשמה',
    endpoint: '/api/generate-3d-fal',
  },
  {
    id: 'depth',
    name: 'מפת עומק',
    desc: 'depth map 3D — מיידי',
    credit: 'חינם, בלי API key',
    endpoint: '',
  },
];

interface ImageUploadProps {
  onImageReady?: (base64: string) => void;
  onModel3D?: (modelUrl: string) => void;
  onDepth3D?: (imageBase64: string) => void;
}

export default function ImageUpload({ onImageReady, onModel3D, onDepth3D }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<Engine>('tripo');
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
      setImageBase64(base64);
      onImageReady?.(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageReady]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImage(file);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) { e.preventDefault(); handleImage(file); return; }
      }
    }
  }, [handleImage]);

  const generateModel = async () => {
    if (!imageBase64) return;

    // Depth map — no API needed, instant client-side
    if (selectedEngine === 'depth') {
      onDepth3D?.(imageBase64);
      return;
    }

    const engine = ENGINES.find(e => e.id === selectedEngine)!;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(engine.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');

      // Stability returns instant result with base64 GLB
      if (data.modelBase64) {
        const blob = new Blob(
          [Uint8Array.from(atob(data.modelBase64), c => c.charCodeAt(0))],
          { type: 'model/gltf-binary' }
        );
        const url = URL.createObjectURL(blob);
        setLoading(false);
        onModel3D?.(url);
        return;
      }

      // Tripo / fal.ai return taskId for polling
      if (data.taskId) {
        pollForModel(data.taskId, engine.endpoint);
        return;
      }

      // Direct modelUrl
      if (data.modelUrl) {
        setLoading(false);
        onModel3D?.(data.modelUrl);
        return;
      }

      throw new Error('Unexpected response');
    } catch (err: any) {
      setError(err.message || 'שגיאה');
      setLoading(false);
    }
  };

  const pollForModel = async (taskId: string, endpoint: string) => {
    let attempts = 0;
    const poll = async () => {
      attempts++;
      if (attempts > 120) { setError('Timeout'); setLoading(false); return; }
      try {
        const res = await fetch(`${endpoint}?taskId=${taskId}`);
        const data = await res.json();
        if (data.status === 'completed' && data.modelUrl) {
          setLoading(false);
          onModel3D?.(data.modelUrl);
        } else if (data.status === 'failed') {
          setError(data.error || 'נכשל');
          setLoading(false);
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
    <div style={s.container}>
      {/* Drop zone */}
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
        onClick={() => !preview && !loading && inputRef.current?.click()}
        tabIndex={0}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={loading} style={{ display: 'none' }} />

        {!preview && !loading && (
          <div style={s.placeholder}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p style={s.placeholderMain}>גרור, הדבק, או לחץ</p>
          </div>
        )}

        {preview && !loading && (
          <img src={preview} alt="preview" style={s.previewImg}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} />
        )}

        {loading && (
          <div style={s.statusOverlay}>
            <div style={s.spinner} />
            <p style={s.statusText}>יוצר מודל 3D...</p>
          </div>
        )}
      </div>

      {/* Engine selector + generate button */}
      {preview && !loading && (
        <div style={s.engineSection}>
          <div style={s.engineButtons}>
            {ENGINES.map(engine => (
              <button
                key={engine.id}
                onClick={() => setSelectedEngine(engine.id)}
                style={{
                  ...s.engineBtn,
                  backgroundColor: selectedEngine === engine.id ? '#111' : '#fff',
                  color: selectedEngine === engine.id ? '#fff' : '#111',
                  borderColor: selectedEngine === engine.id ? '#111' : '#ccc',
                }}
              >
                <span style={s.engineName}>{engine.name}</span>
                <span style={{
                  ...s.engineCredit,
                  color: selectedEngine === engine.id ? '#aaa' : '#999',
                }}>{engine.credit}</span>
              </button>
            ))}
          </div>

          <button onClick={generateModel} style={s.generateBtn}>
            יצור מודל 3D
          </button>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}
    </div>
  );
}

const s: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
  },
  dropZone: {
    width: '100%',
    minHeight: '220px',
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
    padding: '16px',
  },
  placeholderMain: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#999',
    margin: '10px 0 0',
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '220px',
    objectFit: 'contain',
    cursor: 'pointer',
  },
  statusOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
  },
  spinner: {
    width: '28px',
    height: '28px',
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

  // Engine section
  engineSection: {
    marginTop: '12px',
  },
  engineButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  engineBtn: {
    flex: 1,
    padding: '10px 6px',
    border: '2px solid #ccc',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  engineName: {
    fontSize: '13px',
    fontWeight: 700,
  },
  engineCredit: {
    fontSize: '10px',
    fontWeight: 400,
  },
  generateBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  error: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#fff0f0',
    border: '1px solid #c00',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#c00',
    textAlign: 'center',
  },
};
