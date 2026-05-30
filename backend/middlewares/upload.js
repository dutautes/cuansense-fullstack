const multer = require("multer")
const path = require("path")

// config storage multer, mau disimpen di mana dan namanya apa
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // semua file yang diupload user gue simpen di folder uploads
        // path.join gue pake biar pathnya sesuai OS (Windows/Mac/Linux)
        cb(null, path.join(__dirname, "../uploads"))
    },
    filename: function (req, file, cb) {
        // gue kasih nama file yang unik biar ga ketimpa kalau ada nama yang sama
        // formatnya: namafield-timestamp-angkarandom.ekstensi
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname) // ambil ekstensi aslinya, misal .jpg .png
        const name = file.fieldname + '-' + uniqueSuffix + ext;
        cb(null, name)
    }
})

// gue export langsung multer dengan config storage di atas
// nanti di routes tinggal panggil upload.single('namafield') atau upload.none()
module.exports = multer({ storage: storage })