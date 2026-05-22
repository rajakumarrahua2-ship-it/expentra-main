import Expense from '../models/expenseModel.js';
import Budget from '../models/budgetModel.js';

// ==========================================
// FINANCIAL DASHBOARD ANALYSIS
// ==========================================
// Aggregates spending patterns, predictions, and health scores
// Triggers category-specific budget warnings automatically
const getAnalysisSummary = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
        const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);
        const threeMonthsAgoStart = new Date(currentYear, currentMonth - 4, 1);
        
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            categoryBreakdown,
            lastMonthSpendData,
            threeMonthsData,
            budget,
            last30DaysExpenses
        ] = await Promise.all([
        // Execute concurrent MongoDB aggregations to minimize API latency
            Expense.aggregate([
                { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$category', categoryExpense: { $sum: '$amount' } } },
                { $sort: { categoryExpense: -1 } }
            ]),
            Expense.aggregate([
                { $match: { userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { userId, date: { $gte: threeMonthsAgoStart, $lte: lastMonthEnd } } },
                { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } }
            ]),
            Budget.findOne({ userId, month: currentMonth, year: currentYear }),
            Expense.aggregate([
                { $match: { userId, date: { $gte: thirtyDaysAgo, $lte: today } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        // Calculate total expenditure mapped to top spending category
        const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0]._id : 'N/A';
        const currSpend = categoryBreakdown.reduce((acc, curr) => acc + curr.categoryExpense, 0);

        // Calculate growth percentage comparing this month against previous month
        const lastSpend = lastMonthSpendData.length > 0 ? lastMonthSpendData[0].total : 0;
        let monthlyGrowth = 0;
        if (lastSpend > 0) {
            monthlyGrowth = ((currSpend - lastSpend) / lastSpend) * 100;
        }

        // Predict upcoming monthly expenses using a 3-month historical average
        const threeMonthsTotal = threeMonthsData.reduce((acc, curr) => acc + curr.total, 0);
        const predictedExpense = threeMonthsData.length > 0 ? (threeMonthsTotal / threeMonthsData.length).toFixed(2) : 0;

        // Calculate a 0-100 score based on total budget utilization percentage
        let healthScore = 100;
        if (budget && budget.limitAmount > 0) {
            const budgetUtilized = (currSpend / budget.limitAmount) * 100;
            if (budgetUtilized > 100) {
                healthScore = Math.max(0, 100 - (budgetUtilized - 100));
            } else if (budgetUtilized > 80) {
                healthScore -= 10;
            }
        } else {
            healthScore = currSpend > 0 ? 50 : 100;
        }

        // ==========================================
// SMART ALERTS & FCM INTEGRATION
// ==========================================
// Identifies category overspending (80% / 100% thresholds)
// and dispatches deep-linked FCM push notifications
        const insights = [];
        if (budget && budget.limitAmount > 0) {
            const assumedCategoryBudget = budget.limitAmount * 0.3;
            
            // Loop limits to top 5 categories to prevent notification spam loops
            for (const cat of categoryBreakdown.slice(0, 5)) {
                const categoryExpense = cat.categoryExpense;
                const categoryUsage = (categoryExpense / assumedCategoryBudget) * 100;
                
                // 100% Threshold Limit Logic: Dispatch immediate FCM notification
                if (categoryUsage > 100) {
                    const overspendPct = (categoryUsage - 100).toFixed(0);
                    const reduceAmt = categoryExpense - assumedCategoryBudget;
                    insights.push({
                        type: 'critical',
                        icon: '⚠️',
                        text: `You are overspending on ${cat._id || 'this category'} by ${overspendPct}%. Reduce ₹${reduceAmt.toFixed(0)} to stay within budget.`
                    });
                    
                    try {
                        const { sendPushNotification, getTokensFromUsers } = await import('../utils/notificationHelper.js');
                        const Notification = (await import('../models/notificationModel.js')).default;
                        
                        const referenceId = `category-budget-${userId}-${cat._id}-${currentMonth}-${currentYear}`;
                        const existingNotif = await Notification.findOne({ user: userId, referenceId });

                        if (!existingNotif) {
                            const tokens = await getTokensFromUsers([userId]);
                            if (tokens.length > 0) {
                                await sendPushNotification(tokens, {
                                    title: "Smart Insight: Overspending",
                                    body: `You are overspending on ${cat._id || 'this category'}. Reduce spending immediately.`,
                                    data: { route: "/dashboard", type: "BUDGET_ALERT" }
                                });
                            }
                            
                            await Notification.create({
                                user: userId,
                                type: 'OVERSPENDING_WARNING',
                                message: `You are overspending on ${cat._id || 'this category'} by ${overspendPct}%. Reduce ₹${reduceAmt.toFixed(0)} to stay within budget.`,
                                referenceId
                            });
                        }
                    } catch (err) {
                        console.error('Failed to send FCM insight notification', err);
                    }
                } else if (categoryUsage > 80) {
                // 80% Threshold Warning Logic: Append to UI insights only
                    insights.push({
                        type: 'warning',
                        icon: '⚠️',
                        text: `You are nearing your limit for ${cat._id || 'this category'} (${categoryUsage.toFixed(0)}% used).`
                    });
                }
            }
        }

        if (lastSpend > 0) {
            const absGrowth = Math.abs(monthlyGrowth).toFixed(0);
            if (monthlyGrowth > 0) {
                insights.push({
                    type: 'info',
                    icon: '📊',
                    text: `Your spending increased by ${absGrowth}% this month`
                });
            } else if (monthlyGrowth < 0) {
                insights.push({
                    type: 'success',
                    icon: '📉',
                    text: `Your spending decreased by ${absGrowth}% this month`
                });
            }
        }

        // ==========================================
// PATTERN-BASED EXPENSE CONTROL
// ==========================================
// Projects the next 30 days based on daily rolling averages
        const last30DaysTotal = last30DaysExpenses.length > 0 ? last30DaysExpenses[0].total : 0;
        const averageDailyExpense = last30DaysTotal / 30;
        const expectedMonthly = averageDailyExpense * 30;

        res.json({
            spendingPattern: {
                topCategory,
            },
            monthlyGrowthPercentage: monthlyGrowth.toFixed(2) + '%',
            futureExpensePrediction: predictedExpense,
            financialHealthScore: healthScore.toFixed(0) + '/100',
            insights,
            patternControl: {
                averageDailyExpense: averageDailyExpense.toFixed(2),
                expectedMonthly: expectedMonthly.toFixed(2)
            }
        });
    } catch (error) {
        next(error);
    }
};

export { getAnalysisSummary };
