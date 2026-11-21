const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

const uploadAdCreative = (req, res, next) => {
  upload.single('adCreative')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post('/', authorize('advertiser'), uploadAdCreative, createReservation);
router.get('/', authorize('superadmin', 'citymanager', 'advertiser'), getReservations);
router.get('/:id', authorize('superadmin', 'citymanager', 'advertiser'), getReservationById);
router.put('/:id/approve', authorize('superadmin', 'citymanager'), approveReservation);
router.put('/:id/reject', authorize('superadmin', 'citymanager'), rejectReservation);

module.exports = router;
