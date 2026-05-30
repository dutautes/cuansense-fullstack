const jwt = require('jsonwebtoken')
const { response } = require("../helpers/response.formatter")
const { auth_secret } = require('../config/base.config')

module.exports = {
    checkToken: async (req, res, next) => {
        // ambil token dari header Authorization yang dikirim client
        const token = req.header("Authorization");

        // kalo g ada token samsek, langsung tolak, suruh login dulu
        if (!token) {
            return res.status(401).json(response(401, "Unauthorized", "Please login and try again!"));
        }

        try {
            // verifikasi token valid atau engga pakai secret key
            // kalau token expired atau dipalsukan, jwt.verify() bakal throw error dan masuk catch
            const check = jwt.verify(token, auth_secret);

            // kalau valid, simpan userId dari payload token ke req
            // biar nanti di controller bisa tau siapa yang lagi request
            req.userId = check.userId;

            next(); // lanjut ke controller
        } catch (error) {
            // token invalid atau expired, suruh login ulang
            return res.status(401).json(response(401, "Unauthorized", "Please login and try again!"));
        }
    }
}