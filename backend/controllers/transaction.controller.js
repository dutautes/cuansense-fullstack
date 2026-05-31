const Validator = require("fastest-validator")
const v = new Validator()
const { Transaction, Wallet, Category } = require("../models")
const { response } = require("../helpers/response.formatter")
const { base_url } = require('../config/base.config')
const { Op } = require('sequelize')
const db = require('../models')
const fs = require('fs')
const path = require('path')

module.exports = {
    // =====================
    // CREATE TRANSACTION (income / expense)
    // =====================
    createTransaction: async (req, res) => {
        // pake database transaction di sini
        // tujuannya: kalau salah satu proses gagal, semua perubahan dibatalin
        // jadi ga ada kasus "transaksi kesimpen tapi saldo ga berubah"
        const t = await db.sequelize.transaction();

        try {
            const { wallet_id, category_id, type, amount, description, transaction_date } = req.body;

            const schema = {
                wallet_id: { type: 'number' },
                category_id: { type: 'number' },
                type: { type: 'enum', values: ['income', 'expense'] },
                amount: { type: 'number', positive: true },
                description: { type: 'string', optional: true },
                transaction_date: { type: 'string' },
            }

            const validate = v.validate({
                wallet_id: Number(wallet_id),
                category_id: Number(category_id),
                type,
                amount: Number(amount),
                description,
                transaction_date,
            }, schema);

            if (validate.length > 0) {
                await t.rollback(); // batalin transaksi kalau validasi gagal
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // cek wallet ada dan milik user yang login
            const wallet = await Wallet.findOne({
                where: { id: wallet_id, user_id: req.userId }
            });
            if (!wallet) {
                await t.rollback();
                return res.status(404).json(response(404, "Wallet tidak ditemukan"));
            }

            // cek kategori ada dan milik user yang login
            const category = await Category.findOne({
                where: { id: category_id, user_id: req.userId }
            });
            if (!category) {
                await t.rollback();
                return res.status(404).json(response(404, "Kategori tidak ditemukan"));
            }

            // kalau expense, cek saldo wallet cukup ga
            if (type === 'expense') {
                if (parseFloat(wallet.balance) < parseFloat(amount)) { // parseFloat untuk pastiin perbandingan angka yang bener
                    await t.rollback();
                    return res.status(400).json(response(400, "Gagal", "Saldo wallet tidak cukup"));
                }
            }

            // kalau ada bukti transaksi yang diupload, ambil nama filenya
            const proof_image = req.file ? req.file.filename : null;

            // simpan transaksi
            const newTransaction = await Transaction.create({
                user_id: req.userId,
                wallet_id: Number(wallet_id),
                category_id: Number(category_id),
                type,
                amount: Number(amount),
                description: description || null,
                transaction_date,
                proof_image,
            }, { transaction: t }); // kasih tau ini bagian dari db transaction biar g asal commit 

            // update saldo wallet
            // kalau income tambah saldo, kalau expense kurangi saldo
            const newBalance = type === 'income'
                ? parseFloat(wallet.balance) + parseFloat(amount)
                : parseFloat(wallet.balance) - parseFloat(amount);

            await wallet.update({ balance: newBalance }, { transaction: t });

            // kalau semua proses berhasil, commit — perubahan disimpan permanen
            await t.commit();

            return res.status(201).json(response(201, "Transaksi berhasil disimpan", {
                ...newTransaction.toJSON(),
                proof_image: proof_image ? `${base_url}/uploads/${proof_image}` : null,
            }));

        } catch (error) {
            // kalau ada error, rollback semua perubahan
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET ALL TRANSACTION dengan filter, search, pagination
    // =====================
    getTransaction: async (req, res) => {
        try {
            // ambil semua query params yang mungkin dikirim FE
            const { type, category_id, wallet_id, start_date, end_date, page, limit } = req.query;

            // buat where clause secara dinamis sesuai filter yang dikirim
            const whereClause = { user_id: req.userId };
            if (type) whereClause.type = type;
            if (category_id) whereClause.category_id = category_id;
            if (wallet_id) whereClause.wallet_id = wallet_id;

            // filter rentang tanggal
            if (start_date && end_date) {
                whereClause.transaction_date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)] // Op.between untuk filter antara dua tanggal
                };
            }

            // pagination
            const currentPage = parseInt(page) || 1; // atau 1 kalau ga dikirim atau bukan angka
            const perPage = parseInt(limit) || 10; // default 10 data per halaman : bisa diubah lewat query ?limit=20 misalnya
            const offset = (currentPage - 1) * perPage; // hitung offset untuk query : jadi nampilin data ke berapa dan sebelumnya di skip

            // findAndCountAll: ambil data sekaligus hitung total datanya
            const { count, rows } = await Transaction.findAndCountAll({
                where: whereClause,
                include: [
                    { model: Wallet, as: 'wallet', attributes: ['id', 'name', 'color'] },
                    { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'type'] },
                ],
                order: [['transaction_date', 'DESC']], // transaksi terbaru muncul duluan
                limit: perPage,
                offset: offset,
            });

            // format proof_image jadi URL lengkap
            const transactions = rows.map(trx => ({
                ...trx.toJSON(),
                proof_image: trx.proof_image
                    ? `${base_url}/uploads/${trx.proof_image}`
                    : null,
            }));

            const totalPages = Math.ceil(count / perPage); // hitung total halaman berdasarkan total data dan perPage (math.ceil untuk pembulatan ke atas, jadi kalau ada sisa data di halaman terakhir, tetap dihitung sebagai 1 halaman)

            return res.status(200).json(response(200, "Success", {
                data: transactions,
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
    // GET DETAIL TRANSACTION
    // =====================
    showTransaction: async (req, res) => {
        try {
            const transaction = await Transaction.findOne({
                where: { id: req.params.id, user_id: req.userId },
                include: [
                    { model: Wallet, as: 'wallet', attributes: ['id', 'name', 'color'] },
                    { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'type'] },
                ],
            });

            if (!transaction) {
                return res.status(404).json(response(404, "Transaksi tidak ditemukan"));
            }

            return res.status(200).json(response(200, "Success", {
                ...transaction.toJSON(),
                proof_image: transaction.proof_image
                    ? `${base_url}/uploads/${transaction.proof_image}`
                    : null,
            }));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // DELETE TRANSACTION
    // =====================
    deleteTransaction: async (req, res) => {
        const t = await db.sequelize.transaction();

        try {
            const transaction = await Transaction.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!transaction) {
                await t.rollback();
                return res.status(404).json(response(404, "Transaksi tidak ditemukan"));
            }

            // ambil wallet terkait buat rollback saldo
            const wallet = await Wallet.findOne({
                where: { id: transaction.wallet_id }
            });

            // balikkin saldo wallet sebelum transaksi dihapus
            // kalau transaksi nya income, kurangi saldo balik
            // kalau transaksi nya expense, tambahin saldo balik
            const restoredBalance = transaction.type === 'income'
                ? parseFloat(wallet.balance) - parseFloat(transaction.amount)
                : parseFloat(wallet.balance) + parseFloat(transaction.amount);

            await wallet.update({ balance: restoredBalance }, { transaction: t });

            // hapus bukti transaksi dari folder uploads kalau ada
            if (transaction.proof_image) {
                const filePath = path.join(__dirname, '../uploads', transaction.proof_image);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await transaction.destroy({ transaction: t });
            await t.commit();

            return res.status(200).json(response(200, "Transaksi berhasil dihapus"));

        } catch (error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
}