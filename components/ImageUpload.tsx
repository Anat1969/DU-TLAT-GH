'use client';

import React, { useState } from 'react';

interface ImageUploadProps {
  onModel3D?: (modelUrl: string) => void;
}

export default function ImageUpload({ onModel3D }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('בחר תמונה בלבד (JPG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      setError('');
      await processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageBase64: string) => {
    setLoading(true);
    setStep('analyzing');
    setError('');

    try {
      // Step 1: Claude Vision → prompt
      const visionRes = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const visionData = await visionRes.json();
      if (!visionRes.ok) throw new Error(visionData.error || 'Failed to analyze image');

      // Step 2: Tripo3D → 3D model
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
    const maxAttempts = 120;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      if (attempts > maxAttempts) {
        setError('Timeout — המודל לקח יותר מדי זמן');
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
    <div style={styles.container}>
      <h3 style={styles.title}>העלה תמונה ליצירת מודל 3D</h3>

      <div style={styles.uploadArea}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          style={styles.input}
        />
        <p style={styles.hint}>JPG, PNG — התמונה תנותח ותהפוך למודל תלת מימדי</p>
      </div>

      {preview && (
        <img src={preview} alt="preview" style={styles.previewImage} />
      )}

      {loading && (
        <div style={styles.status}>
          {step === 'analyzing' && '🔍 מנתח תמונה עם Claude Vision...'}
          {step === 'generating' && '🧊 יוצר מודל 3D עם Tripo3D (1-2 דקות)...'}
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '30px',
    paddingTop: '25px',
    borderTop: '1px solid #cccccc',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'normal',
    marginBottom: '15px',
    letterSpacing: '0.5px',
    textAlign: 'right',
  },
  uploadArea: {
    border: '2px dashed #cccccc',
    padding: '25px',
    textAlign: 'center',
    marginBottom: '15px',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: '#666666',
    margin: '10px 0 0 0',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '180px',
    display: 'block',
    marginBottom: '15px',
    border: '1px solid #cccccc',
  },
  status: {
    padding: '12px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #cccccc',
    fontSize: '13px',
    color: '#333333',
    marginBottom: '10px',
    textAlign: 'right',
  },
  error: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #000000',
    fontSize: '13px',
    color: '#000000',
    textAlign: 'right',
  },
};
