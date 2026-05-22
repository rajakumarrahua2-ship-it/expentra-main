import GroupExpense from '../models/groupExpenseModel.js';
import Group from '../models/groupModel.js';
import Settlement from '../models/settlementModel.js';
import { sendPushNotification, notifyGroupMembers, getTokensFromUsers } from '../utils/notificationHelper.js';

// ==========================================
// INTERNAL SETTLEMENT CALCULATOR
// ==========================================
// Determines the raw cash flow required for a single expense
const calculateSettlements = (amount, paidBy, splitBetween, group) => {
    const balances = {};
    const memberMap = {};
    group.members.forEach(m => {
        const id = m.user ? m.user.toString() : m.name;
        balances[id] = 0;
        memberMap[id] = m.name;
    });

    paidBy.forEach(p => {
        const id = p.user ? p.user.toString() : p.name;
        if (balances[id] !== undefined) balances[id] += p.amount;
    });
    splitBetween.forEach(s => {
        const id = s.user ? s.user.toString() : s.name;
        if (balances[id] !== undefined) balances[id] -= s.amount;
    });

    const debtors = [];
    const creditors = [];
    Object.keys(balances).forEach(id => {
        const bal = Math.round(balances[id] * 100) / 100;
        if (bal < 0) debtors.push({ id, balance: bal });
        else if (bal > 0) creditors.push({ id, balance: bal });
    });

    const settlements = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const settleAmt = Math.min(Math.abs(debtor.balance), creditor.balance);

        settlements.push({
            from: { user: debtor.id.length === 24 ? debtor.id : null, name: memberMap[debtor.id] || debtor.id },
            to: { user: creditor.id.length === 24 ? creditor.id : null, name: memberMap[creditor.id] || creditor.id },
            amount: Math.round(settleAmt * 100) / 100,
            reimbursementStatus: 'pending'
        });

        debtor.balance += settleAmt;
        creditor.balance -= settleAmt;
        if (Math.abs(debtor.balance) < 0.01) i++;
        if (Math.abs(creditor.balance) < 0.01) j++;
    }
    return settlements;
};

// ==========================================
// GROUP EXPENSE CREATION
// ==========================================
// Records a shared expense, calculates the split, and notifies debtors
export const addGroupExpense = async (req, res, next) => {
    try {
        const { groupId, title, amount, paidBy, splitType, splitDetails, category, note, date } = req.body;
        const group = await Group.findById(groupId);
        if (!group) throw new Error('Group not found');

        // Calculate how much each member mathematically owes based on split type
        let splitBetween = [];
        if (splitType === 'equal') {
            const membersInvolved = splitDetails?.length > 0 ? splitDetails : group.members.map(m => ({ user: m.user, name: m.name }));
            const share = Math.round((amount / membersInvolved.length) * 100) / 100;
            splitBetween = membersInvolved.map(m => ({ user: m.user, name: m.name, amount: share }));
            const diff = amount - splitBetween.reduce((s, m) => s + m.amount, 0);
            if (diff !== 0) splitBetween[0].amount = Math.round((splitBetween[0].amount + diff) * 100) / 100;
        } else {
            // Handles exact value or percentage based splits
            splitBetween = splitDetails.map(m => ({ user: m.user, name: m.name, amount: m.share || m.amount }));
        }

        const settlements = calculateSettlements(amount, paidBy, splitBetween, group);

        const expense = await GroupExpense.create({
            groupId, title, amount, paidBy, splitType, splitDetails, splitBetween, settlements, category, note, date: date || Date.now()
        });

        // Targeted Notifications: 1. Debtors | 2. Others | 3. Skip Sender
        const debtors = settlements.filter(s => s.from.user).map(s => s.from.user.toString());
        const otherMembers = group.members
            .filter(m => m.user && m.user.toString() !== req.user._id.toString() && !debtors.includes(m.user.toString()))
            .map(m => m.user);

        // 1. Notify Debtors specifically (Avoids double notifications)
        settlements.forEach(async (s) => {
            if (s.from.user && s.from.user.toString() !== req.user._id.toString()) {
                const debtorTokens = await getTokensFromUsers([s.from.user]);
                if (debtorTokens.length > 0) {
                    await sendPushNotification(debtorTokens, {
                        title: "Payment Reminder ⚠️",
                        body: `Added "${title}" in ${group.name}: You owe ₹${s.amount} to ${s.to.name}`,
                        data: { url: "/groups/settlement" }
                    });
                }
            }
        });

        // 2. Notify other members (Not involved in debts)
        if (otherMembers.length > 0) {
            const memberTokens = await getTokensFromUsers(otherMembers);
            if (memberTokens.length > 0) {
                await sendPushNotification(memberTokens, {
                    title: "New Group Expense 🧾",
                    body: `${req.user.name} added ₹${amount} for "${title}" in ${group.name}`,
                    data: { url: `/group/${groupId}` }
                });
            }
        }

        res.status(201).json(expense);
    } catch (error) { next(error); }
};

// REST OF THE CONTROLLER (RESTORED FROM BACKUP IN THOUGHT PROCESS)
export const getGroupExpenses = async (req, res, next) => {
    try {
        const expenses = await GroupExpense.find({ groupId: req.params.groupId }).sort({ date: -1 });
        res.json(expenses);
    } catch (error) { next(error); }
};

export const getGroupSettlements = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id.toString();
        const expenses = await GroupExpense.find({ groupId });
        const group = await Group.findById(groupId);

        const balances = {};
        group.members.forEach(m => {
            const id = m.user ? m.user.toString() : m.name;
            balances[id] = { memberInfo: m, balance: 0 };
        });

        const paid = [];

        // ── Factor in per-expense settlements ──
        expenses.forEach(exp => {
            exp.paidBy.forEach(p => { if (balances[p.user || p.name]) balances[p.user || p.name].balance += p.amount; });
            exp.splitBetween.forEach(s => { if (balances[s.user || s.name]) balances[s.user || s.name].balance -= s.amount; });
            exp.settlements.forEach(s => {
                if (s.reimbursementStatus === 'paid') {
                    if (balances[s.from.user || s.from.name]) balances[s.from.user || s.from.name].balance += s.amount;
                    if (balances[s.to.user || s.to.name]) balances[s.to.user || s.to.name].balance -= s.amount;
                    paid.push({ ...s.toObject(), expenseTitle: exp.title, expenseId: exp._id });
                }
            });
        });

        // ── Factor in already-paid optimized (standalone) settlements ──
        const paidOptimized = await Settlement.find({ groupId, status: 'paid' });
        paidOptimized.forEach(s => {
            const fromKey = s.fromUser?.user?.toString() || s.fromUser?.name;
            const toKey   = s.toUser?.user?.toString()   || s.toUser?.name;
            if (balances[fromKey]) balances[fromKey].balance += s.amount;
            if (balances[toKey])   balances[toKey].balance   -= s.amount;
            paid.push({
                _id: s._id,
                from: { user: s.fromUser?.user, name: s.fromUser?.name },
                to:   { user: s.toUser?.user,   name: s.toUser?.name },
                amount: s.amount,
                reimbursementStatus: 'paid',
                paymentMethod: s.paymentMethod,
                paymentDate: s.paymentDate,
                isOptimized: true,
            });
        });

        // ==========================================
        // DEBT OPTIMIZATION ALGORITHM
        // ==========================================
        // Calculates the minimum number of transactions needed to settle all group debts
        // Uses a greedy approach: matches the largest debtor with the largest creditor
        const debtors = [];
        const creditors = [];

        Object.values(balances).forEach(b => {
            const bal = Math.round(b.balance * 100) / 100;
            const info = b.memberInfo.toObject ? b.memberInfo.toObject() : b.memberInfo;
            if (bal < -0.01) debtors.push({ ...info, balance: bal });
            else if (bal > 0.01) creditors.push({ ...info, balance: bal });
        });

        // Sort: debtors ascending (most negative first), creditors descending (most positive first)
        debtors.sort((a, b) => a.balance - b.balance);
        creditors.sort((a, b) => b.balance - a.balance);

        // Fetch all pending optimized settlement docs for this group to attach their real _ids
        const pendingOptimizedDocs = await Settlement.find({ groupId, status: 'pending' });

        const optimizedSettlements = [];
        let i = 0, j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const settleAmt = Math.min(Math.abs(debtor.balance), creditor.balance);

            if (settleAmt > 0) {
                const roundedAmt = Math.round(settleAmt * 100) / 100;

                // Check if a pending Settlement doc already exists for this pair + amount
                const existingDoc = pendingOptimizedDocs.find(d =>
                    d.fromUser?.user?.toString() === debtor.user?.toString() &&
                    d.toUser?.user?.toString()   === creditor.user?.toString() &&
                    Math.abs(d.amount - roundedAmt) < 0.01
                );

                optimizedSettlements.push({
                    _id: existingDoc ? existingDoc._id.toString() : null,
                    tempId: Math.random().toString(36).substring(7), // for React keys when _id is null
                    from: { user: debtor.user, name: debtor.name },
                    to:   { user: creditor.user, name: creditor.name },
                    amount: roundedAmt,
                    reimbursementStatus: 'pending',
                    isOptimized: true,
                });
            }

            debtor.balance += settleAmt;
            creditor.balance -= settleAmt;

            if (Math.abs(debtor.balance) < 0.01) i++;
            if (Math.abs(creditor.balance) < 0.01) j++;
        }

        let totalOwedToUser = 0; let totalUserOwes = 0;
        optimizedSettlements.forEach(s => {
            const isFrom = s.from.user?.toString() === userId;
            const isTo   = s.to.user?.toString()   === userId;
            if (isFrom) totalUserOwes   += s.amount;
            if (isTo)   totalOwedToUser += s.amount;
        });

        res.json({
            balances: Object.values(balances),
            totalOwedToUser,
            totalUserOwes,
            pendingReimbursements: optimizedSettlements,
            paidReimbursements: paid,
            optimizedSettlements,
        });
    } catch (error) { next(error); }
};

// ==========================================
// SETTLEMENT PAYMENT (Per-Expense)
// ==========================================
// Marks a specific per-expense sub-document settlement as paid
export const markSettlementAsPaid = async (req, res, next) => {
    try {
        const { groupId, expenseId, settlementId } = req.params;
        const expense = await GroupExpense.findById(expenseId);
        const settlement = expense.settlements.id(settlementId);

        settlement.reimbursementStatus = 'paid';
        settlement.paymentDate = new Date();
        await expense.save();

        if (settlement.to && (settlement.to.user || settlement.to._id)) {
            const receiverId = settlement.to.user || settlement.to._id;
            const receiverTokens = await getTokensFromUsers([receiverId]);
            if (receiverTokens.length > 0) {
                await sendPushNotification(receiverTokens, {
                    title: "Payment Received 💰",
                    body: `Confirming ₹${settlement.amount} paid by ${req.user.name} for "${expense.title}"`,
                    data: { url: "/groups/settlement" }
                });
            }
        }
        res.json({ message: 'Marked as paid' });
    } catch (error) { next(error); }
};

// ==========================================
// OPTIMIZED SETTLEMENT PAYMENT
// ==========================================
// Persists an optimized (computed) settlement as paid in the Settlement collection
// This allows the debt algorithm to factor it into future net balance calculations
export const markOptimizedSettlementAsPaid = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { from, to, amount, paymentMethod, settlementDocId } = req.body;

        // If a doc already exists (from a previous GET that attached the _id), update it
        if (settlementDocId) {
            const doc = await Settlement.findById(settlementDocId);
            if (doc) {
                doc.status = 'paid';
                doc.paymentMethod = paymentMethod || 'cash';
                doc.paymentDate = new Date();
                doc.paidByUser = req.user._id;
                await doc.save();

                // FCM to payee
                if (to?.user) {
                    const tokens = await getTokensFromUsers([to.user]);
                    if (tokens.length > 0) {
                        await sendPushNotification(tokens, {
                            title: 'Payment Received 💰',
                            body: `₹${amount} settled by ${req.user.name}`,
                            data: { url: '/groups/settlement' },
                        });
                    }
                }
                return res.json({ message: 'Optimized settlement marked as paid', _id: doc._id });
            }
        }

        // Otherwise create a new Settlement doc (first time this pair is marked paid)
        const doc = await Settlement.create({
            groupId,
            fromUser: from,
            toUser:   to,
            amount:   Math.round(Number(amount) * 100) / 100,
            status:   'paid',
            paymentMethod: paymentMethod || 'cash',
            paymentDate: new Date(),
            paidByUser: req.user._id,
        });

        // FCM to payee
        if (to?.user) {
            const tokens = await getTokensFromUsers([to.user]);
            if (tokens.length > 0) {
                await sendPushNotification(tokens, {
                    title: 'Payment Received 💰',
                    body: `₹${amount} settled by ${req.user.name}`,
                    data: { url: '/groups/settlement' },
                });
            }
        }

        res.json({ message: 'Optimized settlement marked as paid', _id: doc._id });
    } catch (error) { next(error); }
};

// ==========================================
// EXPENSE DELETION
// ==========================================
// Removes a group expense and notifies all members
export const deleteGroupExpense = async (req, res, next) => {
    try {
        const expense = await GroupExpense.findByIdAndDelete(req.params.expenseId);
        const group = await Group.findById(req.params.groupId);
        notifyGroupMembers(req.params.groupId, req.user._id, {
            title: "Expense Deleted 🗑️",
            body: `${req.user.name} removed "${expense.title}" from ${group.name}`
        });
        res.json({ message: 'Deleted' });
    } catch (error) { next(error); }
};

// ==========================================
// EXPENSE MODIFICATION
// ==========================================
// Updates a group expense and recalculates settlements dynamically
export const updateGroupExpense = async (req, res, next) => {
    try {
        const { groupId, expenseId } = req.params;
        const { title, amount, paidBy, splitType, splitDetails, category, note, date } = req.body;
        const group = await Group.findById(groupId);
        const expense = await GroupExpense.findById(expenseId);

        let splitBetween = [];
        if (splitType === 'equal') {
            const membersInvolved = splitDetails?.length > 0 ? splitDetails : group.members.map(m => ({ user: m.user, name: m.name }));
            const share = Math.round((amount / membersInvolved.length) * 100) / 100;
            splitBetween = membersInvolved.map(m => ({ user: m.user, name: m.name, amount: share }));
            const diff = amount - splitBetween.reduce((s, m) => s + m.amount, 0);
            if (diff !== 0) splitBetween[0].amount = Math.round((splitBetween[0].amount + diff) * 100) / 100;
        } else {
            splitBetween = splitDetails.map(m => ({ user: m.user, name: m.name, amount: m.share || m.amount }));
        }

        const settlements = calculateSettlements(amount, paidBy, splitBetween, group);

        expense.title = title; expense.amount = amount; expense.paidBy = paidBy;
        expense.splitType = splitType; expense.splitDetails = splitDetails;
        expense.splitBetween = splitBetween; expense.settlements = settlements;
        expense.category = category; expense.note = note; if (date) expense.date = new Date(date);

        await expense.save();

        notifyGroupMembers(groupId, req.user._id, {
            title: "Expense Updated ✏️",
            body: `${req.user.name} updated "${title}" in ${group.name}`
        });

        res.json(expense);
    } catch (error) { next(error); }
};
