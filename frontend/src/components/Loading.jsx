import React, { useState, useEffect } from 'react';

export default function Loading() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 1200);
    const timer2 = setTimeout(() => setStep(3), 2600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="loading-card">
      <div className="spinner"></div>
      <h3 className="loading-title">Analyzing Product...</h3>
      <p className="loading-subtitle">Running OCR extraction & Legal Metrology validation</p>

      <div className="loading-steps">
        <div className={`step-item ${step >= 1 ? 'completed' : ''}`}>
          <span className="step-icon">{step >= 1 ? '✓' : '○'}</span>
          <span className="step-text">Image received & preprocessed</span>
        </div>

        <div className={`step-item ${step >= 2 ? 'completed' : 'pending'}`}>
          <span className="step-icon">{step >= 2 ? '✓' : '⏳'}</span>
          <span className="step-text">Extracting label text via OCR</span>
        </div>

        <div className={`step-item ${step >= 3 ? 'completed' : 'pending'}`}>
          <span className="step-icon">{step >= 3 ? '✓' : '○'}</span>
          <span className="step-text">Evaluating Legal Metrology 2011 rules</span>
        </div>
      </div>
    </div>
  );
}
