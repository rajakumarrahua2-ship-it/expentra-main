import Expense from '../models/expenseModel.js';
import Category from '../models/categoryModel.js';
import { checkAndNotifyBudgetOverflow } from '../controllers/budgetController.js';
import { detectCategory } from '../utils/categoryDetector.js';
import { sendPushNotification } from '../utils/notificationHelper.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

// ==========================================
// EXPENSE CREATION
// ==========================================
// Records a new transaction and intelligently triggers
// Budget Overflows and Smart Alerts on unexpected spending
const createExpense = async (req, res, next) => {
    const { title, amount, category, note, location, date, groupId, paymentMethod, recurring } = req.body;

    try {
        if (!title) {
            res.status(400);
            return next(new Error('Title is required'));
        }
        if (!amount) {
            res.status(400);
            return next(new Error('Amount is required and must be a number'));
        }
        if (Number(amount) <= 0) {
            res.status(400);
            return next(new Error('Amount must be greater than 0'));
        }

        const categories = await Category.find({ type: 'expense', isActive: true });
        const detectedCategory = detectCategory(title, categories);

        const expense = new Expense({
            userId: req.user._id,
            groupId: groupId || null,
            title,
            amount: Number(amount),
            category: detectedCategory,
            note: note || '',
            location: location || '',
            date: date || Date.now(),
            paymentMethod: paymentMethod || 'cash',
            recurring: recurring === true || recurring === 'true',
        });

        const createdExpense = await expense.save();

        // Execute non-blocking validation to see if this expense breaks the monthly budget limit
        const budgetDate = new Date(createdExpense.date);
        checkAndNotifyBudgetOverflow(req.user._id, budgetDate.getMonth() + 1, budgetDate.getFullYear());

        // Evaluate if today's cumulative spending exceeds double the 30-day average
        try {
            const thirtyDaysAgo = new Date(createdExpense.date);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const last30DaysExpenses = await Expense.aggregate([
                { $match: { userId: req.user._id, date: { $gte: thirtyDaysAgo, $lte: new Date(createdExpense.date) } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const avgDaily = last30DaysExpenses.length > 0 ? last30DaysExpenses[0].total / 30 : 0;

            const startOfDay = new Date(createdExpense.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(createdExpense.date);
            endOfDay.setHours(23, 59, 59, 999);
            const todaysExpenses = await Expense.aggregate([
                { $match: { userId: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const todaysTotal = todaysExpenses.length > 0 ? todaysExpenses[0].total : 0;

            if (avgDaily > 0 && todaysTotal > avgDaily * 2) {
                const recentAlert = await Notification.findOne({
                    user: req.user._id,
                    type: 'OVERSPENDING_WARNING',
                    referenceId: { $regex: /^smart-alert-/ },
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                });

                if (!recentAlert) {
                    const user = await User.findById(req.user._id);
                    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
                        await sendPushNotification(user.fcmTokens, {
                            title: "Smart Alert",
                            body: "Unusual high spending detected today. Please review your expenses.",
                            data: { route: "/expenses", type: "SMART_ALERT" }
                        });
                    }

                    await Notification.create({
                        user: req.user._id,
                        type: 'OVERSPENDING_WARNING',
                        message: 'Unusual high spending detected today. Please review your expenses.',
                        referenceId: `smart-alert-${req.user._id}-${new Date().toISOString().split('T')[0]}`
                    });
                }
            }
        } catch (err) {
            console.error("Failed to process smart alert:", err);
        }

        res.status(201).json(createdExpense);
    } catch (error) {
        next(error);
    }
};


// ==========================================
// EXPENSE RETRIEVAL
// ==========================================
// Fetches the user's transaction history with optional month/year filtering
const getExpenses = async (req, res, next) => {
    try {
        const { month, year, category } = req.query;

        let query = { userId: req.user._id };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (category) {
            query.category = category;
        }

        const expenses = await Expense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// EXPENSE MODIFICATION
// ==========================================
// Modifies an existing expense record and re-evaluates budget overflow
const updateExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            if (expense.userId.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to update this expense');
            }

            expense.title = req.body.title || expense.title;
            expense.amount = req.body.amount ? Number(req.body.amount) : expense.amount;
            expense.category = req.body.category || expense.category;
            expense.note = req.body.note !== undefined ? req.body.note : expense.note;
            expense.location = req.body.location || expense.location;
            expense.date = req.body.date || expense.date;
            expense.groupId = req.body.groupId || expense.groupId;
            expense.paymentMethod = req.body.paymentMethod || expense.paymentMethod;
            if (req.body.recurring !== undefined) expense.recurring = req.body.recurring === true || req.body.recurring === 'true';

            const updatedExpense = await expense.save();

            // Re-check budget passively to ensure limit compliance after modification
            const budgetDate = new Date(updatedExpense.date);
            checkAndNotifyBudgetOverflow(req.user._id, budgetDate.getMonth() + 1, budgetDate.getFullYear());

            res.json(updatedExpense);
        } else {
            res.status(404);
            throw new Error('Expense not found');
        }
    } catch (error) {
        next(error);
    }
};

// ==========================================
// EXPENSE DELETION
// ==========================================
// Removes an expense record entirely
const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            if (expense.userId.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to delete this expense');
            }

            const budgetDate = new Date(expense.date);
            await Expense.deleteOne({ _id: req.params.id });

            // Re-evaluate budget in case deletion restored the user below the limit
            checkAndNotifyBudgetOverflow(req.user._id, budgetDate.getMonth() + 1, budgetDate.getFullYear());

            res.json({ message: 'Expense removed' });
        } else {
            res.status(404);
            throw new Error('Expense not found');
        }
    } catch (error) {
        next(error);
    }
};

export { createExpense, getExpenses, updateExpense, deleteExpense };
