import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                'BUDGET_EXCEEDED',
                'BUDGET_WARNING',
                'OVERSPENDING_WARNING',
                'SMART_INSIGHT',
                'SETTLEMENT_PENDING',
                'GROUP_EXPENSE',
                'PAYMENT_RECEIVED',
                'INFO'
            ],
        },
        message: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
        },
        // To prevent duplicate dynamic notifications, we can store a unique ref
        referenceId: {
            type: String,
        },
        dismissed: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

// Index for performance and expiry if needed
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ referenceId: 1 }, { unique: true, sparse: true }); // Prevent duplicate notifications

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
