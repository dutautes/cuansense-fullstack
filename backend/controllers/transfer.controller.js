const Validator = require("fastest-validator")
const v = new Validator()
const { Transfer, Wallet } = require("../models")
const { response } = require("../helpers/response.formatter")
const { Op } = require('sequelize')
const db = require('../models')

module.exports = {

    // =====================
    // CREATE TRANSFER
    // =====================
    createTransfer: async (req, res) => {
        // pake database transaction biar kalau gagal di tengah jalan
        // saldo kedua wallet ga kekacauan
        const t = await db.sequelize.transaction(); // deklarasi transaction

        try {
            const { from_wallet_id, to_wallet_id, amount, description, transfer_date } = req.body;

            const schema = {
                from_wallet_id: { type: 'number' },
                to_wallet_id: { type: 'number' },
                amount: { type: 'number', positive: true },
                description: { type: 'string', optional: true },
                transfer_date: { type: 'string' },
            }

            const validate = v.validate({
                from_wallet_id: Number(from_wallet_id),
                to_wallet_id: Number(to_wallet_id),
                amount: Number(amount),
                description,
                transfer_date,
            }, schema);

            if (validate.length > 0) {
                await t.rollback();
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // ga boleh transfer ke wallet yang sama
            if (from_wallet_id === to_wallet_id) {
                await t.rollback();
                return res.status(400).json(response(400, "Gagal", "Tidak bisa transfer ke wallet yang sama"));
            }

            // cek wallet asal ada dan milik user yang login
            const fromWallet = await Wallet.findOne({
                where: { id: from_wallet_id, user_id: req.userId }
            });
            if (!fromWallet) {
                await t.rollback();
                return res.status(404).json(response(404, "Wallet asal tidak ditemukan"));
            }

            // cek wallet tujuan ada dan milik user yang login
            const toWallet = await Wallet.findOne({
                where: { id: to_wallet_id, user_id: req.userId }
            });
            if (!toWallet) {
                await t.rollback();
                return res.status(404).json(response(404, "Wallet tujuan tidak ditemukan"));
            }

            // cek saldo wallet asal cukup ga
            if (parseFloat(fromWallet.balance) < parseFloat(amount)) {
                await t.rollback();
                return res.status(400).json(response(400, "Gagal", "Saldo wallet asal tidak cukup"));
            }

            // simpan data transfer
            const newTransfer = await Transfer.create({
                user_id: req.userId,
                from_wallet_id: Number(from_wallet_id),
                to_wallet_id: Number(to_wallet_id),
                amount: Number(amount),
                description: description || null,
                transfer_date,
            }, { transaction: t });

            // kurangi saldo wallet asal
            await fromWallet.update({
                balance: parseFloat(fromWallet.balance) - parseFloat(amount)
            }, { transaction: t });

            // tambah saldo wallet tujuan
            await toWallet.update({
                balance: parseFloat(toWallet.balance) + parseFloat(amount)
            }, { transaction: t });

            await t.commit();

            return res.status(201).json(response(201, "Transfer berhasil", newTransfer));

        } catch (error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET ALL TRANSFER
    // =====================
    getTransfer: async (req, res) => {
        try {
            const { page, limit } = req.query; // ambil query pagination, misal ?page=
            // 2&limit=10

            const currentPage = parseInt(page) || 1;
            const perPage = parseInt(limit) || 10;
            const offset = (currentPage - 1) * perPage;

            const { count, rows } = await Transfer.findAndCountAll({
                where: { user_id: req.userId },
                include: [
                    { model: Wallet, as: 'from_wallet', attributes: ['id', 'name', 'color'] },
                    { model: Wallet, as: 'to_wallet', attributes: ['id', 'name', 'color'] },
                ],
                order: [['transfer_date', 'DESC']],
                limit: perPage,
                offset: offset,
            });

            const totalPages = Math.ceil(count / perPage); // hitung total halaman berdasarkan total data dan perPage

            return res.status(200).json(response(200, "Success", {
                data: rows,
                pagination: {
                    total_data: count,
                    per_page: perPage,
                    current_page: currentPage,
                    total_pages: totalPages,
                }
            }));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET DETAIL TRANSFER
    // =====================
    showTransfer: async (req, res) => {
        try {
            const transfer = await Transfer.findOne({
                where: { id: req.params.id, user_id: req.userId },
                include: [
                    { model: Wallet, as: 'from_wallet', attributes: ['id', 'name', 'color'] },
                    { model: Wallet, as: 'to_wallet', attributes: ['id', 'name', 'color'] },
                ],
            });

            if (!transfer) {
                return res.status(404).json(response(404, "Transfer tidak ditemukan"));
            }

            return res.status(200).json(response(200, "Success", transfer));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // DELETE TRANSFER
    // =====================
    deleteTransfer: async (req, res) => {
        const t = await db.sequelize.transaction();

        try {
            const transfer = await Transfer.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!transfer) {
                await t.rollback();
                return res.status(404).json(response(404, "Transfer tidak ditemukan"));
            }

            // ambil kedua wallet terkait
            const fromWallet = await Wallet.findOne({ where: { id: transfer.from_wallet_id } });
            const toWallet = await Wallet.findOne({ where: { id: transfer.to_wallet_id } });

            // balikkin saldo kedua wallet ke kondisi sebelum transfer
            await fromWallet.update({
                balance: parseFloat(fromWallet.balance) + parseFloat(transfer.amount)
            }, { transaction: t });

            await toWallet.update({
                balance: parseFloat(toWallet.balance) - parseFloat(transfer.amount)
            }, { transaction: t });

            await transfer.destroy({ transaction: t });
            await t.commit();

            return res.status(200).json(response(200, "Transfer berhasil dihapus"));

        } catch (error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
}