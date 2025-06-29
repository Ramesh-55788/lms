import express from 'express';
import multer from 'multer';
import {
  register,
  login,
  fetchAllUsers,
  uploadBulkUsers,
  deleteUserController,
  updateUserManager,
} from '../controllers/authController';
import { authMiddleware, roleMiddleware } from '../middleware/middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', authMiddleware, roleMiddleware('admin'), asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/users', authMiddleware, asyncHandler(fetchAllUsers));
router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), asyncHandler(deleteUserController));
router.post(
  '/upload-users',
  authMiddleware,
  roleMiddleware('admin'),
  upload.single('file'),
  asyncHandler(uploadBulkUsers)
);
router.put('/users/:id/manager', authMiddleware, roleMiddleware('admin'), asyncHandler(updateUserManager));

export default router;
