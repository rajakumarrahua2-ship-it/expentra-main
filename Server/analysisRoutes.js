import express from 'express';
import { getAnalysisSummary } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, getAnalysisSummary);

export default router;
