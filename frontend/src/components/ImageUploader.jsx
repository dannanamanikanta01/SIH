import React, { useRef } from 'react';
import { Upload, Camera, FileImage, Sparkles, X } from 'lucide-react';

export default function ImageUploader({
  selectedFile,
  previewUrl,
  selectedDemo,
  demoSamples,
  onSelectFile,
  onSelectDemo,
  onClear,
  onVerify,
  loading
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSelectFile(file);
    }
  };

  const hasSelection = Boolean(selectedFile || selectedDemo);

  return (
    <div className="uploader-container">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {!hasSelection ? (
        <>
          {/* Main Dropzone Area */}
          <div
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon">
              <Upload size={38} strokeWidth={1.8} />
            </div>
            <h3 className="dropzone-title">Upload Package Image</h3>
            <p className="dropzone-hint">
              Drag & drop package label image here, or click to browse
            </p>
            <span className="file-types-badge">Supports JPEG, PNG, WebP (Max 10MB)</span>
          </div>

          <div className="divider-or">
            <span>OR</span>
          </div>

          {/* Action buttons */}
          <div className="action-button-row">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileImage size={18} />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={18} />
              <span>Capture Image</span>
            </button>
          </div>

          {/* Demo Fallback Presets for SIH Hackathon Jury */}
          {demoSamples && demoSamples.length > 0 && (
            <div className="demo-section">
              <div className="demo-header">
                <Sparkles size={16} className="sparkle-icon" />
                <span className="demo-title">SIH Demo Presets (Instant 1-Click Verification)</span>
              </div>
              <p className="demo-desc">
                Select a pre-configured sample to test compliance engine behavior instantly:
              </p>
              <div className="demo-cards-grid">
                {demoSamples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="demo-sample-card"
                    onClick={() => onSelectDemo(sample)}
                  >
                    <div className="demo-card-content">
                      <span className="sample-name">{sample.productName}</span>
                      <span className="sample-sub">{sample.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Image Preview & Verify Action */
        <div className="preview-container">
          <div className="preview-header">
            <h4 className="preview-title">Package Selected</h4>
            <button
              type="button"
              className="clear-btn"
              onClick={onClear}
              title="Remove and select another"
            >
              <X size={16} /> Change Image
            </button>
          </div>

          <div className="preview-media-box">
            {previewUrl ? (
              <img src={previewUrl} alt="Package preview" className="preview-img" />
            ) : (
              <div className="demo-preview-banner">
                <Sparkles size={32} />
                <h4>{selectedDemo?.productName}</h4>
                <p>{selectedDemo?.subtitle}</p>
                <span className="demo-tag">SIH Prototype Demo Mode</span>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="file-meta">
              <span>{selectedFile.name}</span>
              <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}

          <div className="verify-action-box">
            <button
              type="button"
              className="primary-verify-btn"
              onClick={onVerify}
              disabled={loading}
            >
              Verify Product Compliance
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
