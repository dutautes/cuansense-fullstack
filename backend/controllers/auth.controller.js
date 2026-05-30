const Validator = require("fastest-validator")
const v = new Validator()
const { User } = require("../models")
const { response } = require("../helpers/response.formatter")
const passwordHash = require('password-hash')
const { auth_secret } = require('../config/base.config')
const jwt = require('jsonwebtoken')
const path = require('path') // buat manipulasi path file, dipake buat hapus foto lama pas update profile
const { base_url } = require('../config/base.config')
const fs = require('fs') // dipake buat hapus foto lama pas update profile

module.exports = {

    // =====================
    // REGISTER
    // =====================
    register: async (req, res) => {
        try {
            const { full_name, email, password } = req.body;

            // definisiin aturan validasi inputan user
            const schema = {
                full_name: { type: 'string', min: 3 },
                email: { type: 'email' }, // fastest-validator udah built-in cek format email
                password: { type: 'string', min: 6 },
            }

            const validate = v.validate({ full_name, email, password }, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // cek dulu email ini udah dipake orang lain ap blm
            const emailExists = await User.findOne({ where: { email } });
            if (emailExists) {
                return res.status(400).json(response(400, "Validasi Error", "Email sudah terdaftar"));
            }

            // kalau ada foto profil yang diupload, ambil namanya
            // kalau ga ada, set null aj
            const profile_picture = req.file ? req.file.filename : null;

            // password dihash dulu sebelum disimpen ke database
            // jadi kalau database bocor, password user tetap aman
            const hashedPassword = passwordHash.generate(password);

            // simpan data user baru ke database
            const newUser = await User.create({
                full_name,
                email,
                password: hashedPassword,
                profile_picture,
            });

            // engga return password
            const userData = {
                id: newUser.id,
                full_name: newUser.full_name,
                email: newUser.email,
                profile_picture: newUser.profile_picture
                    ? `${base_url}/uploads/${newUser.profile_picture}`
                    : null,
            }

            return res.status(201).json(response(201, "Register berhasil", userData));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // LOGIN
    // =====================
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // validasi input
            const schema = {
                email: { type: 'email' },
                password: { type: 'string', min: 6 },
            }

            const validate = v.validate({ email, password }, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // cek apakah email terdaftar
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(400).json(response(400, "Validasi Error", "Email tidak ditemukan"));
            }

            // cocokkan password yang diinput dengan yang ada di database
            const checkPassword = passwordHash.verify(password, user.password);
            if (!checkPassword) {
                return res.status(400).json(response(400, "Validasi Error", "Password salah"));
            }

            // buat JWT token, masukin userId dan email ke payload
            // payload ini nanti bisa diambil di middleware checkToken lewat req.userId
            const token = jwt.sign(
                { userId: user.id, email: user.email, full_name: user.full_name },
                auth_secret
            );

            const userData = {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                profile_picture: user.profile_picture
                    ? `${base_url}/uploads/${user.profile_picture}`
                    : null,
                token: token
            }

            return res.status(200).json(response(200, "Login berhasil", userData));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // GET PROFILE (data user yang lagi login)
    // =====================
    getProfile: async (req, res) => {
        try {
            // req.userId gue dapet dari middleware checkToken
            const user = await User.findOne({
                where: { id: req.userId },
                // exclude (sembunyiin) password dari response, ga perlu dikirim ke FE
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                return res.status(404).json(response(404, "User tidak ditemukan"));
            }

            // manipulasi field profile_picture jadi URL lengkap
            const userData = {
                ...user.toJSON(), // destructure data user dari database
                profile_picture: user.profile_picture
                    ? `${base_url}/uploads/${user.profile_picture}`
                    : null,
            }

            return res.status(200).json(response(200, "Success", userData));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // UPDATE PROFILE
    // =====================
    updateProfile: async (req, res) => {
        try {
            const { full_name } = req.body;

            // ambil data user yang lagi login
            const user = await User.findOne({ where: { id: req.userId } });
            if (!user) {
                return res.status(404).json(response(404, "User tidak ditemukan"));
            }

            let profile_picture = user.profile_picture; // default pake foto lama

            if (req.file) {
                // kalau ada foto lama, hapus dulu dari folder uploads
                if (user.profile_picture) {
                    const oldPath = path.join(__dirname, '../uploads', user.profile_picture);
                    if (fs.existsSync(oldPath)) { // fs buat cek kalo file lama masih ada
                        fs.unlinkSync(oldPath); // hapus file lama
                    }
                }
                // ganti dengan foto baru
                profile_picture = req.file.filename;
            }

            await user.update({
                full_name: full_name || user.full_name,
                profile_picture,
            });

            const userData = {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                profile_picture: user.profile_picture
                    ? `${base_url}/uploads/${user.profile_picture}`
                    : null,
            }

            return res.status(200).json(response(200, "Profil berhasil diupdate", userData));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
}