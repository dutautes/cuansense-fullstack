require("dotenv").config();

module.exports = {
    // disimpen disini biar nanti dipanggin di controller atau lainnya pake file ini
    web_name: process.env.WEB_NAME,
    base_url: process.env.BASE_URL,
    auth_secret: process.env.AUTH_SECRET,
}