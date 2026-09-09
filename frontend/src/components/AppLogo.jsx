import React from 'react';

export default function AppLogo({ size = 48, className = '' }) {
  return (
    <img
      src="/logo.svg"
      alt="Legal Metrology Compliance Verification Logo"
      width={size}
      height={size}
      className={`app-logo ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '12px' }}
    />
  );
}
