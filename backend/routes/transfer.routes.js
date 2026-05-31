const express = require('express')
const router = express.Router()
const upload = require("../middlewares/upload")
const transferController = require("../controllers/transfer.controller")

router.post('/', upload.none(), transferController.createTransfer); // transfer g butuh upload file.
router.get('/', transferController.getTransfer);
router.get('/:id', transferController.showTransfer);
router.delete('/:id', transferController.deleteTransfer);

module.exports = router