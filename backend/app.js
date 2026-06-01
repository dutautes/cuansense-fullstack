const express = require('express')
const app = express()
const port = 3000
const methodOverride = require('method-override') // untuk support HTTP method PUT dan DELETE lewat form HTML
const db = require("./models") // import sequelize lewat models/index.js yang udah auto-load semua model
const authRoutes = require('./routes/auth.routes') // import semua auth routes
const walletRoutes = require('./routes/wallet.routes') // import semua wallet routes
const { checkToken } = require('./middlewares/auth')
const categoryRoutes = require('./routes/category.routes') // import semua category routes
const transactionRoutes = require('./routes/transaction.routes') // import semua transaction routes
const transferRoutes = require('./routes/transfer.routes') // import semua transfer routes
const budgetRoutes = require('./routes/budget.routes') // import semua budget routes
const dashboardRoutes = require('./routes/dashboard.routes') // import semua dashboard routes
const exportRoutes = require('./routes/export.routes') // import semua export routes

// test koneksi database dulu sebelum apapun
db.sequelize.authenticate()
    .then(() => console.log("Database terkoneksi"))
    .catch((error) => console.error("Koneksi gagal:", error))

app.use(express.json()); // untuk parsing JSON body
app.use(methodOverride("_method"));
// folder uploads bisa diakses publik lewat browser
app.use('/uploads', express.static('uploads'));

// daftarin routes dengan prefixnya
app.use('/auth', authRoutes);
app.use('/wallets', checkToken, walletRoutes);
app.use('/categories', checkToken, categoryRoutes);
app.use('/transactions', checkToken, transactionRoutes);
app.use('/transfers', checkToken, transferRoutes);
app.use('/budgets', checkToken, budgetRoutes);
app.use('/dashboards', checkToken, dashboardRoutes);
app.use('/export', checkToken, exportRoutes);

app.get('/', (req, res) => {
    res.send('CuanSense API jalan!')
})

app.listen(port, () => {
    console.log(`Server jalan di port ${port}`)
})

// app.get : buat test endpoint biasa
// app.use : buat daftarin route yang ada di file lain, biar rapi
// app.listen : buat start servernya