// src/routes/leaveRoutes.ts

import express from 'express';

import {
  fetchUsersOnLeaveToday,
  fetchTeamLeave,
  fetchLeaveBalance,
  fetchLeaveTypes,
  requestLeaveHandler,
  getLeaveHistoryHandler,
  cancelLeaveHandler,
  getIncomingRequestsHandler,
  approveLeaveHandler,
  rejectLeaveHandler,
  createLeaveHandler,
  updateLeaveHandler,
  deleteLeaveHandler
} from '../controllers/leaveController';

import { authMiddleware, roleMiddleware } from '../middleware/middleware';

const router = express.Router();

router.post('/request', authMiddleware, requestLeaveHandler);
router.put('/cancel/:leaveRequestId', authMiddleware, cancelLeaveHandler);
router.get('/history/:userId', authMiddleware, getLeaveHistoryHandler);

router.get('/balance/:userId', authMiddleware, fetchLeaveBalance);

router.get('/requests/:userId', authMiddleware, getIncomingRequestsHandler);
router.put('/approve/:approveId', authMiddleware, approveLeaveHandler);
router.put('/reject/:rejectId', authMiddleware, rejectLeaveHandler);

router.get('/types', authMiddleware, fetchLeaveTypes);
router.post('/types', authMiddleware, roleMiddleware('admin'), createLeaveHandler);
router.put('/types/:id', authMiddleware, roleMiddleware('admin'), updateLeaveHandler);
router.delete('/types/:id', authMiddleware, roleMiddleware('admin'), deleteLeaveHandler);

router.get('/on-leave-today', authMiddleware, fetchUsersOnLeaveToday);

router.get('/team-leaves', authMiddleware, fetchTeamLeave);

export default router;
