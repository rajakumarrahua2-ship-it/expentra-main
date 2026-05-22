import User from '../models/userModel.js';
import Expense from '../models/expenseModel.js';

// @desc    Get Advanced Overview Analytics
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
const getAdminAnalytics = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments({});

        const dailyActiveUsers = totalUsers; // fallback since security logs deleted

        const expenses = await Expense.find({});
        const totalExpensesCount = expenses.length;
        const totalTransactionAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        // Top Used Categories
        const catMap = {};
        expenses.forEach(e => {
            if (!catMap[e.category]) catMap[e.category] = 0;
            catMap[e.category] += 1;
        });

        const topCategories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        res.json({
            totalUsers,
            dailyActiveUsers,
            totalExpensesCount,
            totalTransactionAmount,
            topCategories
        });

    } catch (error) {
        next(error);
    }
};

export { getAdminAnalytics };
