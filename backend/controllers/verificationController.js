const {
  verifyProduct,
  getVerificationHistory,
  getVerificationById,
  updateVerificationReview,
  DEMO_SAMPLES
} = require('../services/verificationService');
const PDFDocument = require('pdfkit');

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

    const result = await verifyProduct({
      imageBuffer: file ? file.buffer : null,
      imageMimeType: file ? file.mimetype : '',
      imageName: file ? file.originalname : '',
      demoSampleId,
      isDemo: isDemo === 'true' || isDemo === true,
      userId: req.user.id,
      userRole: req.user.role
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
    const history = await getVerificationHistory(limit, req.user);
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

async function updateReviewHandler(req, res) {
  try {
    const result = await updateVerificationReview(req.params.id, req.body, req.user);
    if (!result) return res.status(404).json({ success: false, message: 'Verification record not found.' });
    return res.json({ success: true, result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

async function downloadReportHandler(req, res) {
  try {
    const record = await getVerificationById(req.params.id, req.user);
    if (!record) return res.status(404).json({ success: false, message: 'Verification record not found.' });

    const extracted = record.extractedData || {};
    const document = new PDFDocument({ size: 'A4', margin: 48 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compliance-${String(record._id)}.pdf"`);
    document.pipe(res);

    document.fillColor('#0f766e').fontSize(22).font('Helvetica-Bold').text('Packaged Product Compliance Report');
    document.moveDown(0.35).fillColor('#64748b').fontSize(9).font('Helvetica').text(`Generated: ${formatDate(record.createdAt)}`);
    document.moveDown(1);

    sectionTitle(document, 'Summary');
    labelValue(document, 'Product', record.productName || 'Packaged Commodity');
    labelValue(document, 'Automated status', record.status);
    labelValue(document, 'Compliance score', `${record.complianceScore}%`);
    labelValue(document, 'Inspector review', record.review?.status || 'PENDING');
    labelValue(document, 'Inspector note', record.review?.note || 'None');

    sectionTitle(document, 'Mandatory Declarations');
    (record.checks || []).forEach(check => {
      const statusColor = check.status === 'PASS' ? '#15803d' : '#b91c1c';
      document.fillColor('#17231f').font('Helvetica-Bold').fontSize(10).text(check.name);
      document.fillColor(statusColor).font('Helvetica-Bold').text(check.status, { continued: true });
      document.fillColor('#475569').font('Helvetica').text(`  ${check.detectedValue || check.reason || 'Not detected'}`);
      if (check.ruleReference) document.fillColor('#64748b').fontSize(8).text(check.ruleReference);
      document.moveDown(0.45);
    });

    sectionTitle(document, 'Extracted Information');
    labelValue(document, 'Manufacturer', extracted.manufacturer || 'Not detected');
    labelValue(document, 'Address', extracted.address || 'Not detected');
    labelValue(document, 'Net quantity', extracted.netQuantity || 'Not detected');
    labelValue(document, 'MRP', extracted.mrp || 'Not detected');
    labelValue(document, 'Manufacturing date', extracted.manufacturingDate || 'Not detected');
    labelValue(document, 'Consumer care', extracted.consumerCare || 'Not detected');

    document.moveDown(1.2).fillColor('#64748b').fontSize(8).font('Helvetica-Oblique').text('Prototype decision-support report. Not a legally binding determination.');
    document.end();
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({ success: false, message: 'Could not generate the report.' });
  }
}

function sectionTitle(document, title) {
  document.moveDown(0.7).fillColor('#0f766e').font('Helvetica-Bold').fontSize(13).text(title);
  document.moveDown(0.25).strokeColor('#dce7df').moveTo(48, document.y).lineTo(547, document.y).stroke();
  document.moveDown(0.55);
}

function labelValue(document, label, value) {
  document.fillColor('#17231f').font('Helvetica-Bold').fontSize(10).text(`${label}: `, { continued: true });
  document.fillColor('#475569').font('Helvetica').text(String(value));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Unknown';
}

module.exports = {
  verifyProductHandler,
  getVerificationsHandler,
  getDemoSamplesHandler,
  updateReviewHandler,
  downloadReportHandler
};
