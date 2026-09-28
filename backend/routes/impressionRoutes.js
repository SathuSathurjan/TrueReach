const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createImpression,
  getImpressions,
  getImpressionSummary,
} = require('../controllers/impressionController');

router.use(protect);

router.post('/', authorize('superadmin', 'citymanager'), createImpression);
router.get('/', authorize('superadmin', 'citymanager', 'advertiser'), getImpressions);
router.get('/summary/:reservationId', authorize('superadmin', 'citymanager', 'advertiser'), getImpressionSummary);

module.exports = router;
