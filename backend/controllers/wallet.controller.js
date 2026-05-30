const Validator = require("fastest-validator")
const v = new Validator()
const { Wallet } = require("../models")
const { response } = require("../helpers/response.formatter")

module.exports = {

    // =====================
    // CREATE WALLET
    // =====================
    createWallet: async (req, res) => {
        try {
            const { name, balance, color } = req.body;

            // validasi input, balance opsional defaultnya 0
            const schema = {
                name: { type: 'string', min: 1 },
                balance: { type: 'number', optional: true },
                color: { type: 'string', optional: true },
            }

            const validate = v.validate({ name, balance: Number(balance), color }, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // user_id ambil dari token yang udah dicek middleware
            const newWallet = await Wallet.create({
                user_id: req.userId,
                name,
                balance: balance || 0,
                color: color || null,
            });

            return res.status(201).json(response(201, "Wallet berhasil dibuat", newWallet));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET ALL WALLET milik user yang login
    // =====================
    getWallet: async (req, res) => {
        try {
            // filter by user_id biar yang muncul cuma wallet milik dia
            const wallets = await Wallet.findAll({
                where: { user_id: req.userId },
                order: [['created_at', 'DESC']] // wallet terbaru muncul duluan
            });

            return res.status(200).json(response(200, "Success", wallets));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET DETAIL WALLET by id
    // =====================
    showWallet: async (req, res) => {
        try {
            const wallet = await Wallet.findOne({
                // memastikan wallet ini milik user yang lagi login
                // biar user lain ga bisa akses wallet orang lain lewat id
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!wallet) {
                return res.status(404).json(response(404, "Wallet tidak ditemukan"));
            }

            return res.status(200).json(response(200, "Success", wallet));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // UPDATE WALLET
    // =====================
    updateWallet: async (req, res) => {
        try {
            const { name, color } = req.body;

            // cari wallet dan pastiin milik user yang login
            const wallet = await Wallet.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!wallet) {
                return res.status(404).json(response(404, "Wallet tidak ditemukan"));
            }

            // ga izinin update balance langsung dari sini
            // balance cuma boleh berubah lewat transaksi atau transfer
            await wallet.update({
                name: name || wallet.name,
                color: color || wallet.color,
            });

            return res.status(200).json(response(200, "Wallet berhasil diupdate", wallet));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // DELETE WALLET
    // =====================
    deleteWallet: async (req, res) => {
        try {
            const wallet = await Wallet.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!wallet) {
                return res.status(404).json(response(404, "Wallet tidak ditemukan"));
            }

            // langsung hapus, transaksi terkait ikut kehapus otomatis
            // karena udah di set onDelete: CASCADE di migration
            await wallet.destroy();

            return res.status(200).json(response(200, "Wallet berhasil dihapus"));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
}