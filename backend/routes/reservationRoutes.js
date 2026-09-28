const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createReservation,
  getReservations,
  getReservationById,
  approveReservation,
  rejectReservation,
} = require('../controllers/reservationController');

router.use(protect);

router.post('/', authorize('advertiser'), createReservation);
router.get('/', authorize('superadmin', 'citymanager', 'advertiser'), getReservations);
router.get('/:id', authorize('superadmin', 'citymanager', 'advertiser'), getReservationById);
router.put('/:id/approve', authorize('superadmin', 'citymanager'), approveReservation);
router.put('/:id/reject', authorize('superadmin', 'citymanager'), rejectReservation);

module.exports = router;
