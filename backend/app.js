const express = require('express')
const app = express()
const port = 3000

// import sequelize lewat models/index.js yang udah auto-load semua model
const db = require("./models")

// test koneksi database dulu sebelum apapun
db.sequelize.authenticate()
    .then(() => console.log("Database terkoneksi"))
    .catch((error) => console.error("❌ Koneksi gagal:", error))

app.get('/', (req, res) => {
    res.send('CuanSense API jalan!')
})

app.listen(port, () => {
    console.log(`Server jalan di port ${port}`)
})