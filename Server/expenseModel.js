import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
        },
        // Family: which group member paid (sub-doc _id from group.members)
        paidByMember: {
            type: mongoose.Schema.Types.ObjectId,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, 'Amount must be positive'],
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        note: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        paymentMethod: {
            type: String,
            default: 'cash',
            enum: ['cash', 'upi', 'card', 'netbanking', 'other'],
        },
        recurring: {
            type: Boolean,
            default: false,
        },
        recurringProcessed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
expenseSchema.index({ userId: 1 }); // For user expense queries
expenseSchema.index({ userId: 1, date: -1 }); // For sorted expense lists

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
