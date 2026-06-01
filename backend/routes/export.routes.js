const express = require('express')
const router = express.Router()
const exportController = require("../controllers/export.controller")

router.get('/excel', exportController.exportExcel);
router.get('/pdf', exportController.exportPDF);

module.exports = router