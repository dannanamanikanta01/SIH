const path = require('path');
const { verifyProduct, getVerificationHistory, DEMO_SAMPLES } = require('../services/verificationService');

/**
 * Controller to verify a product
 * POST /api/verify
 */
async function verifyProductHandler(req, res) {
  try {
    const file = req.file;
    const { demoSampleId, isDemo } = req.body;

    if (!file && !demoSampleId && isDemo !== 'true' && isDemo !== true) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a product image or select a demo sample.'
      });
    }

    const imagePath = file ? file.path : null;

    const result = await verifyProduct({
      imagePath,
      demoSampleId,
      isDemo: isDemo === 'true' || isDemo === true
    });

    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Verification Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification service is temporarily unavailable. Please try again.'
    });
  }
}

/**
 * Controller to get past verifications
 * GET /api/verifications
 */
async function getVerificationsHandler(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const history = await getVerificationHistory(limit);
    return res.status(200).json({
      success: true,
      count: history.length,
      verifications: history
    });
  } catch (error) {
    console.error('Get Verifications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification history.'
    });
  }
}

/**
 * Controller to list demo samples
 * GET /api/demo-samples
 */
async function getDemoSamplesHandler(req, res) {
  try {
    return res.status(200).json({
      success: true,
      samples: DEMO_SAMPLES.map(s => ({
        id: s.id,
        productName: s.productName,
        subtitle: s.subtitle,
        extractedData: s.extractedData
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch demo samples.'
    });
  }
}

module.exports = {
  verifyProductHandler,
  getVerificationsHandler,
  getDemoSamplesHandler
};
