const express = require('express')
const router = express.Router()
const upload = require("../middlewares/upload")
const categoryController = require("../controllers/category.controller")

// kategori ga butuh upload file 
router.post('/', upload.none(), categoryController.createCategory);
router.get('/', categoryController.getCategory);
router.get('/:id', categoryController.showCategory); // detail 
router.put('/:id', upload.none(), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router