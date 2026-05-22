import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
        },
        fromUser: {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: String,
        },
        toUser: {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        // Tracks whether this optimized settlement has been marked as paid
        status: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'upi', 'bank_transfer'],
            default: 'cash',
        },
        paymentDate: {
            type: Date,
        },
        paidByUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Settlement = mongoose.model('Settlement', settlementSchema);
export default Settlement;
