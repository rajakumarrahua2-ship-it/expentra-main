import express from 'express';
import { createGroup, getGroups, getGroupById, addMemberToGroup, updateMemberInGroup, removeMemberFromGroup, joinGroupByCode, updateGroup, deleteGroup } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createGroup)
router.get('/', protect, getGroups)
router.post('/join', protect, joinGroupByCode);

router.get('/:id', protect, getGroupById)
router.put('/:id', protect, updateGroup)
router.delete('/:id', protect, deleteGroup)


router.put('/:id/members', protect, addMemberToGroup);

router.put('/:id/members/:memberId', protect, updateMemberInGroup)
router.delete('/:id/members/:memberId', protect, removeMemberFromGroup);

export default router;
