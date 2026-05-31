const express = require('express')
const router = express.Router()
const upload = require("../middlewares/upload")
const transactionController = require("../controllers/transaction.controller")

// history
router.get('/history', transactionController.getHistory);

// create transaksi bisa upload bukti transaksi (opsional)
router.post('/', upload.single('proof_image'), transactionController.createTransaction);
router.get('/', transactionController.getTransaction);
router.get('/:id', transactionController.showTransaction);
// transaksi ga bisa diedit, cuma bisa dihapus
// ini umum di aplikasi keuangan biar data histori ga bisa dimanipulasi
router.delete('/:id', transactionController.deleteTransaction);


module.exports = router