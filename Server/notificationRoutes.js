import express from 'express';
import { 
    getNotifications, 
    markAsRead, 
    markAllRead, 
    deleteNotification, 
    clearAll 
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/mark-all-read', protect, markAllRead);
router.patch('/:id/read', protect, markAsRead);
router.delete('/clear-all', protect, clearAll);
router.delete('/:id', protect, deleteNotification);

export default router;
