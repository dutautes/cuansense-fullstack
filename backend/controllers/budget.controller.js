const Validator = require("fastest-validator")
const v = new Validator()
const { Budget, Transaction } = require("../models")
const { response } = require("../helpers/response.formatter")
const { Op } = require('sequelize')
const db = require('../models')

module.exports = {

    // =====================
    // CREATE BUDGET
    // =====================
    createBudget: async (req, res) => {
        try {
            const { month, year, limit_amount } = req.body;

            const schema = {
                month: { type: 'number', min: 1, max: 12 },
                year: { type: 'number', min: 2000 },
                limit_amount: { type: 'number', positive: true },
            }

            const validate = v.validate({
                month: Number(month),
                year: Number(year),
                limit_amount: Number(limit_amount),
            }, schema);

            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // cek apakah budget untuk bulan dan tahun ini udah ada
            // satu user cuma boleh punya 1 budget per bulan per tahun
            const budgetExists = await Budget.findOne({
                where: { user_id: req.userId, month: Number(month), year: Number(year) }
            });

            if (budgetExists) {
                return res.status(400).json(response(400, "Gagal", `Budget untuk bulan ${month}/${year} sudah ada`));
            }

            const newBudget = await Budget.create({
                user_id: req.userId,
                month: Number(month),
                year: Number(year),
                limit_amount: Number(limit_amount),
            });

            return res.status(201).json(response(201, "Budget berhasil dibuat", newBudget));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET ALL BUDGET + status pemakaian
    // =====================
    getBudget: async (req, res) => {
        try {
            const budgets = await Budget.findAll({
                where: { user_id: req.userId },
                order: [['year', 'DESC'], ['month', 'DESC']]
            });

            // untuk setiap budget, gue hitung total pengeluaran di bulan itu
            const budgetWithUsage = await Promise.all(budgets.map(async (budget) => { // karena map sinkronus, jadi pake Promise.all biar bisa tunggu semua proses hitung pemakaian budget selesai baru balikin response

                // ambil total expense di bulan dan tahun yang sesuai budget ini
                const totalExpense = await Transaction.sum('amount', {
                    where: {
                        user_id: req.userId,
                        type: 'expense',
                        transaction_date: {
                            // filter transaksi yang ada di rentang bulan ini
                            [Op.between]: [
                                new Date(budget.year, budget.month - 1, 1),  // awal bulan
                                new Date(budget.year, budget.month, 0)        // akhir bulan
                            ]
                        }
                    }
                });

                const used = parseFloat(totalExpense) || 0; // kalau ga ada transaksi sama sekali, totalExpense bisa null, jadi default ke 0
                const limit = parseFloat(budget.limit_amount);
                const remaining = limit - used;
                const percentage = Math.round((used / limit) * 100);

                return {
                    ...budget.toJSON(),
                    used_amount: used,
                    remaining_amount: remaining,
                    percentage_used: percentage,
                    // warning kalau pemakaian udah lewat 80% dari limit
                    is_warning: percentage >= 80,
                    // over limit kalau udah melebihi budget
                    is_over_limit: used > limit,
                }
            }));

            return res.status(200).json(response(200, "Success", budgetWithUsage));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET DETAIL BUDGET by month & year
    // =====================
    showBudget: async (req, res) => {
        try {
            const { month, year } = req.query;

            const budget = await Budget.findOne({
                where: {
                    user_id: req.userId,
                    month: Number(month),
                    year: Number(year)
                }
            });

            if (!budget) {
                return res.status(404).json(response(404, "Budget tidak ditemukan"));
            }

            // hitung pemakaian budget bulan ini
            const totalExpense = await Transaction.sum('amount', {
                where: {
                    user_id: req.userId,
                    type: 'expense',
                    transaction_date: {
                        [Op.between]: [
                            new Date(budget.year, budget.month - 1, 1),
                            new Date(budget.year, budget.month, 0)
                        ]
                    }
                }
            });

            const used = parseFloat(totalExpense) || 0;
            const limit = parseFloat(budget.limit_amount);
            const remaining = limit - used;
            const percentage = Math.round((used / limit) * 100);

            return res.status(200).json(response(200, "Success", {
                ...budget.toJSON(),
                used_amount: used,
                remaining_amount: remaining,
                percentage_used: percentage,
                is_warning: percentage >= 80,
                is_over_limit: used > limit,
            }));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // UPDATE BUDGET (update limit amount)
    // =====================
    updateBudget: async (req, res) => {
        try {
            const { limit_amount } = req.body;

            const budget = await Budget.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!budget) {
                return res.status(404).json(response(404, "Budget tidak ditemukan"));
            }

            const schema = {
                limit_amount: { type: 'number', positive: true }
            }

            const validate = v.validate({ limit_amount: Number(limit_amount) }, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            await budget.update({ limit_amount: Number(limit_amount) });

            return res.status(200).json(response(200, "Budget berhasil diupdate", budget));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // DELETE BUDGET
    // =====================
    deleteBudget: async (req, res) => {
        try {
            const budget = await Budget.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!budget) {
                return res.status(404).json(response(404, "Budget tidak ditemukan"));
            }

            await budget.destroy();

            return res.status(200).json(response(200, "Budget berhasil dihapus"));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
}