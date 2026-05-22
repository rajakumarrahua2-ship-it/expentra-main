import express from 'express';
import {
    getMonthlyReport,
    getYearlyReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/monthly', protect, getMonthlyReport);
router.get('/yearly', protect, getYearlyReport);

export default router;
