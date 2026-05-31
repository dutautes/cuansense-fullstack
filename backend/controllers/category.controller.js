const Validator = require("fastest-validator")
const v = new Validator()
const { Category } = require("../models")
const { response } = require("../helpers/response.formatter")

module.exports = {

    // =====================
    // CREATE CATEGORY
    // =====================
    createCategory: async (req, res) => {
        try {
            const { name, icon, type } = req.body;

            const schema = {
                name: { type: 'string', min: 1 },
                icon: { type: 'string', optional: true },
                // type cuma boleh income atau expense
                type: { type: 'enum', values: ['income', 'expense'] },
            }

            const validate = v.validate({ name, icon, type }, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // cek apakah kategori dengan nama yang sama udah ada untuk user ini
            const categoryExists = await Category.findOne({
                where: { user_id: req.userId, name, type }
            });
            if (categoryExists) {
                return res.status(400).json(response(400, "Gagal", "Kategori dengan nama ini sudah ada"));
            }

            const newCategory = await Category.create({
                user_id: req.userId,
                name,
                icon: icon || null,
                type,
            });

            return res.status(201).json(response(201, "Kategori berhasil dibuat", newCategory));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET ALL CATEGORY
    // =====================
    getCategory: async (req, res) => {
        try {
            const { type } = req.query;

            // kalau ada query ?type=income atau ?type=expense, filter berdasarkan itu
            // kalau ga ada, tampilkan semua kategori milik user ini
            const whereClause = { user_id: req.userId }; // response dasar
            if (type) whereClause.type = type; // ambil query

            const categories = await Category.findAll({
                where: whereClause,
                order: [['name', 'ASC']] // urut alfabet
            });

            return res.status(200).json(response(200, "Success", categories));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET DETAIL CATEGORY
    // =====================
    showCategory: async (req, res) => {
        try {
            const category = await Category.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!category) {
                return res.status(404).json(response(404, "Kategori tidak ditemukan"));
            }

            return res.status(200).json(response(200, "Success", category));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // UPDATE CATEGORY
    // =====================
    updateCategory: async (req, res) => {
        try {
            console.log(req.body);
            const { name, icon } = req.body;

            const category = await Category.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!category) {
                return res.status(404).json(response(404, "Kategori tidak ditemukan"));
            }

            // type ga boleh diubah setelah dibuat
            // karena bisa kicaw mania in data transaksi yang udah pake kategori ini
            await category.update({
                name: name,
                icon: icon,
            });

            return res.status(200).json(response(200, "Kategori berhasil diupdate", category));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // DELETE CATEGORY
    // =====================
    deleteCategory: async (req, res) => {
        try {
            const category = Category.findOne({
                where: { id: req.params.id, user_id: req.userId }
            });

            if (!category) {
                return res.status(404).json(response(404, "Kategori tidak ditemukan"));
            }

            // cek apakah kategori ini masih dipake di transaksi
            const { Transaction } = require("../models");
            const hasTransaction = await Transaction.findOne({
                where: { category_id: req.params.id }
            });

            if (hasTransaction) {
                return res.status(400).json(response(400, "Gagal", "Kategori masih digunakan di transaksi, tidak bisa dihapus"));
            }

            await Category.destroy({
                where: { id: req.params.id }
            });

            return res.status(200).json(response(200, "Kategori berhasil dihapus"));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
}