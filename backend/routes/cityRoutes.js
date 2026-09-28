const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createCity,
  getCities,
  getCityById,
  updateCity,
  deleteCity,
} = require('../controllers/cityController');

// All city routes require login
router.use(protect);

router.post('/', authorize('superadmin'), createCity);
router.get('/', authorize('superadmin'), getCities);
router.get('/:id', authorize('superadmin', 'citymanager'), getCityById);
router.put('/:id', authorize('superadmin'), updateCity);
router.delete('/:id', authorize('superadmin'), deleteCity);

module.exports = router;
