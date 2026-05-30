const express = require('express')
const router = express.Router()
const upload = require("../middlewares/upload")
const walletController = require("../controllers/wallet.controller")

// wallet ga butuh upload file, pake upload.none() biar req.body kebaca
router.post('/', upload.none(), walletController.createWallet);
router.get('/', walletController.getWallet);
router.get('/:id', walletController.showWallet);
router.put('/:id', upload.none(), walletController.updateWallet);
router.delete('/:id', walletController.deleteWallet);

module.exports = router