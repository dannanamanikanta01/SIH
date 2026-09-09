const { processImage, DEMO_SAMPLES } = require('./ocrService');
const { evaluateCompliance } = require('../rules/complianceRules');
const Verification = require('../models/Verification');
const mongoose = require('mongoose');

// In-memory fallback cache if MongoDB is not connected
const inMemoryHistory = [];

/**
 * Run end-to-end verification on an image file or sample preset.
 */
async function verifyProduct({ imagePath, demoSampleId, customExtractedData = null, isDemo = false }) {
  let extractedData = null;
  let ocrResult = null;
  let productName = 'Packaged Commodity';
  let demoUsed = Boolean(isDemo || demoSampleId);

  // 1. Check if a demo sample preset is selected
  if (demoSampleId) {
    const sample = DEMO_SAMPLES.find(s => s.id === demoSampleId);
    if (sample) {
      extractedData = { ...sample.extractedData };
      productName = sample.productName;
      demoUsed = true;
    }
  }

  // 2. Custom manual overrides or injected demo payload
  if (!extractedData && customExtractedData) {
    extractedData = customExtractedData;
    productName = customExtractedData.productName || productName;
  }

  // 3. If real image provided and no preset, run OCR
  if (!extractedData && imagePath) {
    ocrResult = await processImage(imagePath);
    extractedData = ocrResult.extractedData;
    productName = extractedData.productName || 'Packaged Commodity';
  }

  // Fallback safe object
  if (!extractedData) {
    extractedData = {
      productName: 'Unknown Product',
      manufacturer: null,
      address: null,
      netQuantity: null,
      mrp: null,
      manufacturingDate: null,
      consumerCare: null,
      rawText: ''
    };
  }

  // 4. Run Rule Engine
  const complianceResult = evaluateCompliance(extractedData);

  const verificationRecord = {
    productName: extractedData.productName || productName,
    imagePath: imagePath ? `/uploads/${imagePath.split('/').pop()}` : '',
    extractedData,
    complianceScore: complianceResult.score,
    status: complianceResult.status,
    totalPassed: complianceResult.totalPassed,
    totalRules: complianceResult.totalRules,
    checks: complianceResult.checks,
    detectedIssues: complianceResult.detectedIssues,
    isDemo: demoUsed,
    ocrConfidence: ocrResult ? ocrResult.confidence : null,
    createdAt: new Date()
  };

  // 5. Try saving to MongoDB if connected, else push to memory
  try {
    if (mongoose.connection.readyState === 1) {
      const savedDoc = await Verification.create(verificationRecord);
      verificationRecord._id = savedDoc._id;
    } else {
      verificationRecord._id = 'mem_' + Date.now();
      inMemoryHistory.unshift(verificationRecord);
    }
  } catch (err) {
    console.warn('MongoDB save skipped / failed (using in-memory):', err.message);
    verificationRecord._id = 'mem_' + Date.now();
    inMemoryHistory.unshift(verificationRecord);
  }

  return verificationRecord;
}

/**
 * Fetch past verifications (history)
 */
async function getVerificationHistory(limit = 10) {
  try {
    if (mongoose.connection.readyState === 1) {
      return await Verification.find().sort({ createdAt: -1 }).limit(limit).lean();
    }
  } catch (err) {
    console.warn('MongoDB query failed, falling back to memory:', err.message);
  }
  return inMemoryHistory.slice(0, limit);
}

module.exports = {
  verifyProduct,
  getVerificationHistory,
  DEMO_SAMPLES
};
