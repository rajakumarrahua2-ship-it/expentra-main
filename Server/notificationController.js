import Expense from '../models/expenseModel.js';
import Budget from '../models/budgetModel.js';
import GroupExpense from '../models/groupExpenseModel.js';
import Group from '../models/groupModel.js';
import Notification from '../models/notificationModel.js';

// Helper to create notifications
const createNotification = async (userId, type, message, details = null, referenceId = null) => {
    try {
        if (referenceId) {
            const exists = await Notification.findOne({ user: userId, referenceId });
            if (exists) return exists;
        }
        return await Notification.create({ user: userId, type, message, details, referenceId });
    } catch (error) {
        console.error('Failed to create notification', error);
    }
};

// @desc    Get all notifications and alerts
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        const last24h = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // ── SYNC DYNAMIC ALERTS TO DB ──
        // This ensures the user has alerts even if the system hasn't manually triggered them yet.

        // 1. Budget Alerts
        const budget = await Budget.findOne({ userId, month: currentMonth, year: currentYear });
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const personalSpend = await Expense.aggregate([
            { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const currSpend = personalSpend.length > 0 ? personalSpend[0].total : 0;

        if (budget && currSpend > budget.limitAmount) {
            await createNotification(
                userId,
                'BUDGET_EXCEEDED',
                `Personal budget exceeded by ₹${(currSpend - budget.limitAmount).toFixed(0)}!`,
                { limit: budget.limitAmount, spent: currSpend },
                `budget-${userId}-${currentMonth}-${currentYear}`
            );
        } else if (budget && currSpend > budget.limitAmount * 0.8) {
             await createNotification(
                userId,
                'BUDGET_WARNING',
                `Warning: You have used 80% of your budget for this month.`,
                { limit: budget.limitAmount, spent: currSpend },
                `budget-warning-${userId}-${currentMonth}-${currentYear}`
            );
        }

        // 1.5 Spending Behavior Insight
        const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);
        const lastMonthSpendReq = await Expense.aggregate([
            { $match: { userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const lastSpend = lastMonthSpendReq.length > 0 ? lastMonthSpendReq[0].total : 0;

        let insightMessage = null;
        if (lastSpend > 0) {
            const monthlyGrowth = ((currSpend - lastSpend) / lastSpend) * 100;
            const absGrowth = Math.abs(monthlyGrowth).toFixed(0);
            if (monthlyGrowth > 0) {
                insightMessage = `Your spending increased by ${absGrowth}% this month`;
            } else if (monthlyGrowth < 0) {
                insightMessage = `Your spending decreased by ${absGrowth}% this month`;
            }
        }

        if (insightMessage) {
            await createNotification(
                userId,
                'SMART_INSIGHT',
                insightMessage,
                null,
                `spending-insight-${userId}-${currentMonth}-${currentYear}`
            );
        }

        // 2. Group Alerts
        const userGroups = await Group.find({ 'members.user': userId });
        const groupIds = userGroups.map(g => g._id);

        if (groupIds.length > 0) {
            // New group expenses
            const recentGroupExpenses = await GroupExpense.find({
                groupId: { $in: groupIds },
                createdAt: { $gte: last24h },
                'paidBy.user': { $ne: userId }
            }).populate('groupId', 'name');

            for (const exp of recentGroupExpenses) {
                await createNotification(
                    userId,
                    'GROUP_EXPENSE',
                    `New: ₹${exp.amount} for "${exp.title}" added in ${exp.groupId.name}`,
                    { groupId: exp.groupId._id, expenseId: exp._id },
                    `expense-${userId}-${exp._id}`
                );
            }

            // Settlements & Payments
            const allGroupExpenses = await GroupExpense.find({ groupId: { $in: groupIds } });
            for (const exp of allGroupExpenses) {
                for (const s of exp.settlements) {
                     // Owe someone
                    if (s.from.user?.toString() === userId.toString() && s.reimbursementStatus === 'pending') {
                        await createNotification(
                            userId,
                            'SETTLEMENT_PENDING',
                            `Reminder: You owe ₹${s.amount} to ${s.to.name}`,
                            { expenseId: exp._id },
                            `settlement-pending-${userId}-${exp._id}-${s.to.user}`
                        );
                    }
                    // Payment received
                    if (s.to.user?.toString() === userId.toString() && s.reimbursementStatus === 'paid' && s.paymentDate >= last24h) {
                        await createNotification(
                            userId,
                            'PAYMENT_RECEIVED',
                            `Payment Received: ₹${s.amount} from ${s.from.name}`,
                            { expenseId: exp._id },
                            `payment-received-${userId}-${exp._id}-${s.from.user}`
                        );
                    }
                }
            }
        }

        // ── FETCH PERSISTENT NOTIFICATIONS ──
        const notifications = await Notification.find({ user: userId, dismissed: false })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
const markAllRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete (Dismiss) a notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { dismissed: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
const clearAll = async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user._id, dismissed: false }, { dismissed: true });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        next(error);
    }
};

export { 
    getNotifications, 
    markAsRead, 
    markAllRead, 
    deleteNotification, 
    clearAll 
};
