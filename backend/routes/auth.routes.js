const express = require('express')
const router = express.Router()
const upload = require("../middlewares/upload")
const authController = require("../controllers/auth.controller")
const { checkToken } = require("../middlewares/auth")

// register boleh upload foto profil, tapi opsional
router.post('/register', upload.single('profile_picture'), authController.register);

// login ga butuh upload file
router.post('/login', upload.none(), authController.login);

// get profile dan update profile butuh token dulu (harus login)
router.get('/profile', checkToken, authController.getProfile);
router.put('/profile', checkToken, upload.single('profile_picture'), authController.updateProfile);

module.exports = router