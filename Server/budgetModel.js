import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
        },
        limitAmount: {
            type: Number,
            required: true,
        },
        savingGoal: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
