const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  productName: {
    type: String,
    default: 'Packaged Commodity'
  },
  imageData: {
    type: Buffer,
    default: null,
    select: false
  },
  imageMimeType: {
    type: String,
    default: ''
  },
  imageName: {
    type: String,
    default: ''
  },
  extractedData: {
    productName: { type: String, default: null },
    manufacturer: { type: String, default: null },
    address: { type: String, default: null },
    netQuantity: { type: String, default: null },
    mrp: { type: String, default: null },
    manufacturingDate: { type: String, default: null },
    consumerCare: { type: String, default: null },
    rawText: { type: String, default: '' }
  },
  complianceScore: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['COMPLIANT', 'NON_COMPLIANT'],
    required: true
  },
  checks: [
    {
      id: String,
      name: String,
      status: {
        type: String,
        enum: ['PASS', 'FAIL']
      },
      detectedValue: String,
      reason: String,
      ruleReference: String
    }
  ],
  detectedIssues: [String],
  isDemo: {
    type: Boolean,
    default: false
  },
  review: {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    note: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Verification', VerificationSchema);
