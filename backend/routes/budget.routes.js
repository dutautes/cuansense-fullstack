const express = require('express')
const router = express.Router()
const upload = require("../middlewares/upload")
const budgetController = require("../controllers/budget.controller")

router.post('/', upload.none(), budgetController.createBudget);
router.get('/', budgetController.getBudget);
// get detail by month & year pake query params
// contoh: GET /budgets/detail?month=5&year=2026
router.get('/detail', budgetController.showBudget);
router.put('/:id', upload.none(), budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router