const { Transaction, Transfer, Wallet, Budget, Category } = require("../models")
const { response } = require("../helpers/response.formatter")
const { Op } = require('sequelize')
const db = require('../models')

module.exports = {
    // =====================
    // GET DASHBOARD
    // =====================
    getDashboard: async (req, res) => {
        try {
            // ambil bulan dan tahun dari query, default ke bulan ini
            const month = parseInt(req.query.month) || new Date().getMonth() + 1; // +1 karena getMonth() mulai dari 0 (0 = Januari, 1 = Februari, dst)
            const year = parseInt(req.query.year) || new Date().getFullYear();

            // rentang tanggal bulan yang dipilih
            const startDate = new Date(year, month - 1, 1); // jadi bulan 1 (Januari) itu month=0, bulan 2 (Februari) itu month=1, dst
            const endDate = new Date(year, month, 0, 23, 59, 59); // tanggal 0 di bulan berikutnya itu otomatis jadi tanggal terakhir di bulan ini
            // new Date(year,month,day, hours,minutes,seconds)

            // =====================
            // 1. TOTAL SALDO SEMUA WALLET
            // =====================
            const wallets = await Wallet.findAll({
                where: { user_id: req.userId },
                attributes: ['id', 'name', 'balance', 'color']
            });

            const totalBalance = wallets.reduce((sum, wallet) => {
                return sum + parseFloat(wallet.balance);
            }, 0);

            // =====================
            // 2. TOTAL INCOME BULAN INI
            // =====================
            const totalIncome = await Transaction.sum('amount', {
                where: {
                    user_id: req.userId,
                    type: 'income',
                    transaction_date: { [Op.between]: [startDate, endDate] }
                }
            });

            // =====================
            // 3. TOTAL EXPENSE BULAN INI
            // =====================
            const totalExpense = await Transaction.sum('amount', {
                where: {
                    user_id: req.userId,
                    type: 'expense',
                    transaction_date: { [Op.between]: [startDate, endDate] }
                }
            });

            // =====================
            // 4. PENGELUARAN PER KATEGORI (buat pie chart)
            // =====================
            const expenseByCategory = await Transaction.findAll({
                where: {
                    user_id: req.userId,
                    type: 'expense',
                    transaction_date: { [Op.between]: [startDate, endDate] }
                },
                include: [
                    { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }
                ],
                attributes: [
                    'category_id',
                    // sum amount per kategori
                    [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
                ],
                group: ['category_id', 'category.id', 'category.name', 'category.icon'],
                order: [[db.sequelize.literal('total'), 'DESC']]
            });

            // =====================
            // 5. INCOME VS EXPENSE PER HARI (buat line/bar chart)
            // =====================
            const dailyTransactions = await Transaction.findAll({
                where: {
                    user_id: req.userId,
                    transaction_date: { [Op.between]: [startDate, endDate] }
                },
                attributes: [
                    // group by tanggal
                    [db.sequelize.fn('DATE', db.sequelize.col('transaction_date')), 'date'],
                    'type',
                    [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
                ],
                group: [
                    db.sequelize.fn('DATE', db.sequelize.col('transaction_date')),
                    'type'
                ],
                order: [[db.sequelize.fn('DATE', db.sequelize.col('transaction_date')), 'ASC']]
            });

            // =====================
            // 6. BUDGET STATUS BULAN INI
            // =====================
            const budget = await Budget.findOne({
                where: { user_id: req.userId, month, year }
            });

            let budgetStatus = null;
            if (budget) {
                const used = parseFloat(totalExpense) || 0; // atau 0 kalau totalExpense null
                const limit = parseFloat(budget.limit_amount);
                budgetStatus = {
                    limit_amount: limit,
                    used_amount: used,
                    remaining_amount: limit - used,
                    percentage_used: Math.round((used / limit) * 100),
                    is_warning: Math.round((used / limit) * 100) >= 80,
                    is_over_limit: used > limit,
                }
            }

            // =====================
            // 7. TRANSAKSI TERBARU (5 terakhir)
            // =====================
            const recentTransactions = await Transaction.findAll({
                where: { user_id: req.userId },
                include: [
                    { model: Wallet, as: 'wallet', attributes: ['id', 'name', 'color'] },
                    { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }
                ],
                order: [['created_at', 'DESC']],
                limit: 5
            });

            return res.status(200).json(response(200, "Success", {
                period: { month, year },
                total_balance: totalBalance,
                wallets: wallets,
                summary: {
                    total_income: parseFloat(totalIncome) || 0, // kalo null jadi 0
                    total_expense: parseFloat(totalExpense) || 0, // kalo null jadi 0
                    net: (parseFloat(totalIncome) || 0) - (parseFloat(totalExpense) || 0),
                },
                budget_status: budgetStatus,
                expense_by_category: expenseByCategory,
                daily_transactions: dailyTransactions,
                recent_transactions: recentTransactions,
            }));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}