const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createUser,
  getUsers,
  getUserById,
  approveCityManager,
  updateUserStatus,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

router.use(protect, authorize('superadmin'));

router.post('/', createUser);
router.get('/', getUsers);
router.put('/:id/approve', approveCityManager);
router.put('/:id/status', updateUserStatus);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
