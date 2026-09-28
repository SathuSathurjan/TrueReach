const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createTimeslot,
  getTimeslots,
  getTimeslotById,
  updateTimeslot,
  deleteTimeslot,
} = require('../controllers/timeslotController');

router.use(protect);

router.post('/', authorize('superadmin', 'citymanager'), createTimeslot);
router.get('/', authorize('superadmin', 'citymanager', 'advertiser'), getTimeslots);
router.get('/:id', authorize('superadmin', 'citymanager', 'advertiser'), getTimeslotById);
router.put('/:id', authorize('superadmin', 'citymanager'), updateTimeslot);
router.delete('/:id', authorize('superadmin', 'citymanager'), deleteTimeslot);

module.exports = router;
