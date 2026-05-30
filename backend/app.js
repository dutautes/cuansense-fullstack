const express = require('express')
const app = express()
const port = 3000
const methodOverride = require('method-override') // untuk support HTTP method PUT dan DELETE lewat form HTML
const db = require("./models") // import sequelize lewat models/index.js yang udah auto-load semua model
const authRoutes = require('./routes/auth.routes') // import semua auth routes
const walletRoutes = require('./routes/wallet.routes') // import semua wallet routes
const { checkToken } = require('./middlewares/auth')

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

app.get('/', (req, res) => {
    res.send('CuanSense API jalan!')
})

app.listen(port, () => {
    console.log(`Server jalan di port ${port}`)
})