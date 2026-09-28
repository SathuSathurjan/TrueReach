const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} = require('../controllers/boardController');

router.use(protect);

router.post('/', authorize('superadmin', 'citymanager'), createBoard);
router.get('/', authorize('superadmin', 'citymanager', 'advertiser'), getBoards);
router.get('/:id', authorize('superadmin', 'citymanager', 'advertiser'), getBoardById);
router.put('/:id', authorize('superadmin', 'citymanager'), updateBoard);
router.delete('/:id', authorize('superadmin', 'citymanager'), deleteBoard);

module.exports = router;
