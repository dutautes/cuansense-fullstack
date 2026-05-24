require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// app.use : mendaftarkan routing atau config header lain, urutannya sebelum app.get
app.use(express.json()); // mengizinkan req.body format json
app.use(cors()); // mengizinkan semua domain (fe) untuk akses API

app.get('/', (req, res) => {
    res.send('CuanSense API Running');
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})