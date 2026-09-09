const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth, allowRoles } = require('../middleware/auth');

const {
  verifyProductHandler,
  getVerificationsHandler,
  getDemoSamplesHandler,
  updateReviewHandler,
  downloadReportHandler
} = require('../controllers/verificationController');

// File filter: accept images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Please upload a valid image file (JPEG, PNG, or WebP).'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Routes
router.post('/verify', requireAuth, allowRoles('admin', 'inspector', 'user'), upload.single('image'), verifyProductHandler);
router.get('/verifications', requireAuth, allowRoles('admin', 'inspector', 'user'), getVerificationsHandler);
router.patch('/verifications/:id/review', requireAuth, allowRoles('admin', 'inspector'), updateReviewHandler);
router.get('/verifications/:id/report', requireAuth, allowRoles('admin', 'inspector', 'user'), downloadReportHandler);
router.get('/demo-samples', requireAuth, allowRoles('admin', 'inspector', 'user'), getDemoSamplesHandler);

module.exports = router;
