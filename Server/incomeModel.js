import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, 'Amount must be positive'],
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: false,
            trim: true,
            default: '',
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        month: {
            type: Number,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-populate month and year from date before saving
incomeSchema.pre('save', function (next) {
    if (this.date) {
        this.month = this.date.getMonth() + 1;
        this.year = this.date.getFullYear();
    }
    next();
});

const Income = mongoose.model('Income', incomeSchema);
export default Income;
