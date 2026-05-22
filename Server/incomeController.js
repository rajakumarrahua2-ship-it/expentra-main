import Income from '../models/incomeModel.js';
import Category from '../models/categoryModel.js';
import { detectCategory } from '../utils/categoryDetector.js';

// @desc    Get logged in user incomes (supports ?month=&year= filtering)
// @route   GET /api/incomes
// @access  Private
export const getIncomes = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        let query = { userId: req.user._id };

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const incomes = await Income.find(query).sort({ date: -1 });
        res.json(incomes);
    } catch (error) {
        next(error);
    }
};

// @desc    Add new income
// @route   POST /api/incomes
// @access  Private
export const addIncome = async (req, res, next) => {
    try {
        const { title, amount, category, description, date } = req.body;
        
        if (!title) {
            res.status(400);
            throw new Error('Title is required');
        }

        const categories = await Category.find({ type: 'income', isActive: true });
        const detectedCategory = detectCategory(title, categories);

        const income = new Income({
            userId: req.user._id,
            title,
            amount,
            category: detectedCategory,
            description,
            date: date || new Date(),
        });

        const createdIncome = await income.save();
        res.status(201).json(createdIncome);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete income
// @route   DELETE /api/incomes/:id
// @access  Private
export const deleteIncome = async (req, res, next) => {
    try {
        const income = await Income.findById(req.params.id);

        if (income && income.userId.toString() === req.user._id.toString()) {
            await Income.deleteOne({ _id: income._id });
            res.json({ message: 'Income removed' });
        } else {
            res.status(404);
            throw new Error('Income not found or user not authorized');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update income
// @route   PUT /api/incomes/:id
// @access  Private
export const updateIncome = async (req, res, next) => {
    try {
        const { title, amount, category, description, date } = req.body;
        const income = await Income.findById(req.params.id);

        if (income && income.userId.toString() === req.user._id.toString()) {
            income.title = title || income.title;
            income.amount = amount || income.amount;
            income.category = category || income.category;
            income.description = description || income.description;
            if (date) income.date = date;

            const updatedIncome = await income.save();
            res.json(updatedIncome);
        } else {
            res.status(404);
            throw new Error('Income not found or user not authorized');
        }
    } catch (error) {
        next(error);
    }
};
