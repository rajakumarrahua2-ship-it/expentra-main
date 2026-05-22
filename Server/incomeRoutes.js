import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getIncomes, addIncome, deleteIncome, updateIncome } from '../controllers/incomeController.js';

const router = express.Router();

router.get('/',protect, getIncomes)
router.post('/',protect, addIncome)
router.delete('/:id',protect, deleteIncome)
router.put('/:id',protect, updateIncome)

export default router;
