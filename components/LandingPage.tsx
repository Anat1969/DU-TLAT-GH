'use client';

import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div dir="rtl" style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>DU-TLAT</h1>
        <p style={styles.subtitle}>
          מרעיון &mdash; לתמונה &mdash; לתלת-מימד
        </p>

        <div style={styles.poeticBlock}>
          <p style={styles.poetic}>
            כל רעיון מתחיל כמשפט.
            <br />
            כל משפט הופך לתמונה.
            <br />
            כל תמונה נושמת לתוך מרחב.
          </p>
        </div>

        <div style={styles.stepsRow}>
          <div style={styles.step}>
            <div style={styles.stepNum}>1</div>
            <div style={styles.stepTitle}>זקק</div>
            <p style={styles.stepDesc}>תאר את הרעיון &mdash; הגרעין, המתח, המדיום. AI יתרגם אותו לפרומפט ויזואלי מדויק.</p>
          </div>
          <div style={styles.stepDivider} />
          <div style={styles.step}>
            <div style={styles.stepNum}>2</div>
            <div style={styles.stepTitle}>צור</div>
            <p style={styles.stepDesc}>העתק את הפרומפט ל-Midjourney או כל מנוע תמונות. צור את הוויזואל שתואם לקונספט.</p>
          </div>
          <div style={styles.stepDivider} />
          <div style={styles.step}>
            <div style={styles.stepNum}>3</div>
            <div style={styles.stepTitle}>הנשם</div>
            <p style={styles.stepDesc}>העלה את התמונה. Tripo3D יהפוך אותה למודל תלת-מימדי אינטראקטיבי &mdash; סובב, התקרב, חקור.</p>
          </div>
        </div>

        <button onClick={onEnter} style={styles.enterBtn}>
          התחל ליצור
        </button>

        <p style={styles.footer}>
          ללא הרשמה. ללא תשלום. פשוט תתחיל.
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#111',
    padding: '40px 20px',
  },
  hero: {
    maxWidth: '700px',
    textAlign: 'center',
  },
  title: {
    fontSize: '72px',
    fontWeight: 800,
    margin: '0 0 8px 0',
    letterSpacing: '-2px',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: '22px',
    color: '#555',
    margin: '0 0 40px 0',
    fontWeight: 300,
  },
  poeticBlock: {
    borderRight: '3px solid #111',
    paddingRight: '20px',
    marginBottom: '48px',
    textAlign: 'right',
  },
  poetic: {
    fontSize: '20px',
    lineHeight: 2,
    color: '#333',
    margin: 0,
    fontStyle: 'italic',
  },
  stepsRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '0',
    marginBottom: '48px',
  },
  step: {
    flex: 1,
    padding: '0 16px',
    textAlign: 'center',
  },
  stepDivider: {
    width: '1px',
    alignSelf: 'stretch',
    backgroundColor: '#ddd',
    flexShrink: 0,
  },
  stepNum: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#111',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 10px',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  stepDesc: {
    fontSize: '15px',
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
  },
  enterBtn: {
    padding: '16px 64px',
    backgroundColor: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    marginBottom: '20px',
  },
  footer: {
    fontSize: '14px',
    color: '#aaa',
    margin: 0,
  },
};
