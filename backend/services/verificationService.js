const { processImage, DEMO_SAMPLES } = require('./ocrService');
const { evaluateCompliance } = require('../rules/complianceRules');
const Verification = require('../models/Verification');
const mongoose = require('mongoose');

// In-memory fallback cache if MongoDB is not connected
const inMemoryHistory = [];

/**
 * Run end-to-end verification on uploaded image bytes or a sample preset.
 */
async function verifyProduct({ imageBuffer = null, imageMimeType = '', imageName = '', demoSampleId, verificationId = null, customExtractedData = null, isDemo = false, userId = null }) {
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
  if (!extractedData && imageBuffer) {
    ocrResult = await processImage(imageBuffer);
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

  const analysisFields = {
    productName: extractedData.productName || productName,
    imageData: imageBuffer,
    imageMimeType,
    imageName,
    extractedData,
    complianceScore: complianceResult.score,
    status: complianceResult.status,
    totalPassed: complianceResult.totalPassed,
    totalRules: complianceResult.totalRules,
    checks: complianceResult.checks,
    detectedIssues: complianceResult.detectedIssues,
    isDemo: demoUsed,
    ocrConfidence: ocrResult ? ocrResult.confidence : null,
    review: {
      status: 'PENDING',
      note: '',
      reviewedBy: null,
      reviewedAt: null
    }
  };

  if (verificationId) {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(verificationId)) {
        const updated = await Verification.findByIdAndUpdate(
          verificationId,
          { $set: analysisFields },
          { new: true, runValidators: true }
        ).select('-imageData').lean();
        if (!updated) throw new Error('Verification record not found.');
        return withoutImageData(updated);
      }

      const existing = inMemoryHistory.find(item => String(item._id) === String(verificationId));
      if (!existing) throw new Error('Verification record not found.');
      Object.assign(existing, analysisFields);
      return withoutImageData(existing);
    } catch (err) {
      console.error('Inspector verification update failed:', err.message);
      throw err;
    }
  }

  const verificationRecord = {
    createdBy: userId || null,
    productName: extractedData.productName || productName,
    imageData: imageBuffer,
    imageMimeType,
    imageName,
    extractedData,
    complianceScore: complianceResult.score,
    status: complianceResult.status,
    totalPassed: complianceResult.totalPassed,
    totalRules: complianceResult.totalRules,
    checks: complianceResult.checks,
    detectedIssues: complianceResult.detectedIssues,
    isDemo: demoUsed,
    ocrConfidence: ocrResult ? ocrResult.confidence : null,
    review: {
      status: 'PENDING',
      note: '',
      reviewedBy: null,
      reviewedAt: null
    },
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

  return withoutImageData(verificationRecord);
}

/**
 * Fetch past verifications (history)
 */
async function getVerificationHistory(limit = 10, user = null) {
  try {
    if (mongoose.connection.readyState === 1) {
      const filter = user?.role === 'user'
        ? (mongoose.Types.ObjectId.isValid(user.id) ? { createdBy: user.id } : { createdBy: null })
        : {};
      const query = Verification.find(filter).select('-imageData').sort({ createdAt: -1 });
      if (limit > 0) query.limit(limit);
      return await query.lean();
    }
  } catch (err) {
    console.warn('MongoDB query failed, falling back to memory:', err.message);
  }
  const visibleHistory = user?.role === 'user'
    ? inMemoryHistory.filter(item => item.createdBy === user.id)
    : inMemoryHistory;
  const records = limit > 0 ? visibleHistory.slice(0, limit) : visibleHistory;
  return records.map(withoutImageData);
}

function canAccessVerification(record, user) {
  return user?.role !== 'user' || String(record.createdBy || '') === String(user.id);
}

async function getVerificationById(id, user = null) {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const record = await Verification.findById(id).select('-imageData').lean();
      return record && canAccessVerification(record, user) ? record : null;
    }
  } catch (err) {
    console.warn('Verification lookup failed:', err.message);
  }

  const record = inMemoryHistory.find(item => String(item._id) === String(id));
  return record && canAccessVerification(record, user) ? record : null;
}

function withoutImageData(record) {
  if (!record) return record;
  const result = { ...record };
  delete result.imageData;
  return result;
}

async function updateVerificationReview(id, { status, note = '' }, reviewer) {
  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    throw new Error('Review status must be PENDING, APPROVED, or REJECTED.');
  }

  const review = {
    status,
    note: String(note).trim().slice(0, 1000),
    reviewedBy: reviewer.id,
    reviewedAt: new Date()
  };

  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
    const updated = await Verification.findByIdAndUpdate(id, { $set: { review } }, { new: true }).select('-imageData').lean();
    return withoutImageData(updated);
  }

  const record = inMemoryHistory.find(item => String(item._id) === String(id));
  if (!record) return null;
  record.review = review;
  return withoutImageData(record);
}

module.exports = {
  verifyProduct,
  getVerificationHistory,
  getVerificationById,
  updateVerificationReview,
  DEMO_SAMPLES
};
