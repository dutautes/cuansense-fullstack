module.exports = {
    // key object yang akan dipanggil pas export/require di file lain
    response: (status, message, data) => {
        if (data) {
            // kalau responsenya ada data
            return {
                status: status,
                message: message,
                data: data,
            }
        } else {
            // kalau response gaada data ( misal error ) hasil di postmannya jgn kirim key data
            return {
                status: status,
                message: message,
            }
        }
    }
}