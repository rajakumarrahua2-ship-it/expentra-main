import Expense from '../models/expenseModel.js';
import Income from '../models/incomeModel.js';

// @desc    Get monthly summary and category-wise total
// @route   GET /api/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res, next) => {
    const { month, year } = req.query;

    if (!month || !year) {
        res.status(400);
        return next(new Error('Please provide month and year'));
    }

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const report = await Expense.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    category: '$_id',
                    totalAmount: 1,
                    count: 1,
                    _id: 0,
                },
            },
            {
                $sort: { totalAmount: -1 },
            },
        ]);

        const totalSpent = report.reduce((acc, curr) => acc + curr.totalAmount, 0);

        // Calculate Total Income for the month
        const incomeReport = await Income.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$amount' },
                },
            },
        ]);

        const totalIncome = incomeReport.length > 0 ? incomeReport[0].totalIncome : 0;
        const remainingBalance = totalIncome - totalSpent;

        res.json({
            month,
            year,
            totalSpent,
            totalIncome,
            remainingBalance,
            categoryWise: report,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get yearly summary
// @route   GET /api/reports/yearly
// @access  Private
const getYearlyReport = async (req, res, next) => {
    const { year } = req.query;

    if (!year) {
        res.status(400);
        return next(new Error('Please provide a year'));
    }

    try {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        const report = await Expense.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    month: '$_id',
                    totalAmount: 1,
                    count: 1,
                    _id: 0,
                },
            },
            {
                $sort: { month: 1 },
            },
        ]);

        const totalSpent = report.reduce((acc, curr) => acc + curr.totalAmount, 0);

        res.json({
            year,
            totalSpent,
            monthlyBreakdown: report,
        });
    } catch (error) {
        next(error);
    }
};

export { getMonthlyReport, getYearlyReport };
