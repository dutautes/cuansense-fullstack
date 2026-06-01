const { Transaction, Wallet, Category } = require("../models")
const { response } = require("../helpers/response.formatter")
const { Op } = require('sequelize')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')

module.exports = {

    // =====================
    // EXPORT EXCEL
    // =====================
    exportExcel: async (req, res) => {
        try {
            const { month, year, wallet_id } = req.query;

            // bangun filter transaksi
            const whereClause = { user_id: req.userId };
            if (wallet_id) whereClause.wallet_id = wallet_id;
            if (month && year) {
                whereClause.transaction_date = {
                    [Op.between]: [
                        new Date(year, month - 1, 1),
                        new Date(year, month, 0, 23, 59, 59) // year, month, day, hour, minute, second
                    ]
                };
            }

            // ambil semua transaksi sesuai filter
            const transactions = await Transaction.findAll({
                where: whereClause,
                include: [
                    { model: Wallet, as: 'wallet', attributes: ['id', 'name'] },
                    { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }
                ],
                order: [['transaction_date', 'DESC']]
            });

            // bikin workbook baru ( workbook : file excel, worksheet : sheet di excel)
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Laporan Transaksi');

            // definisiin kolom header
            worksheet.columns = [
                { header: 'No', key: 'no', width: 5 },
                { header: 'Tanggal', key: 'date', width: 15 },
                { header: 'Tipe', key: 'type', width: 10 },
                { header: 'Kategori', key: 'category', width: 20 },
                { header: 'Wallet', key: 'wallet', width: 20 },
                { header: 'Jumlah', key: 'amount', width: 20 },
                { header: 'Deskripsi', key: 'description', width: 30 },
            ];

            // styling header
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // warna putih
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4CAF50' } // warna hijau CuanSense
                };
                cell.alignment = { horizontal: 'center' };
            });

            // isi data transaksi ke baris excel
            transactions.forEach((trx, index) => {
                const row = worksheet.addRow({
                    no: index + 1,
                    date: new Date(trx.transaction_date).toLocaleDateString('id-ID'), // format tanggal jadi dd/mm/yyyy
                    type: trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                    category: `${trx.category.icon} ${trx.category.name}`,
                    wallet: trx.wallet.name,
                    amount: parseFloat(trx.amount),
                    description: trx.description || '-',
                });

                // warnain baris income hijau, expense merah
                row.getCell('type').font = {
                    color: { argb: trx.type === 'income' ? 'FF00AA00' : 'FFCC0000' }
                };

                // format kolom amount jadi rupiah
                row.getCell('amount').numFmt = '"Rp "#,##0.00'; // numFmt : format angka, # buat digit, 0 buat digit wajib, . buat desimal, "Rp " buat prefix Rp
            });

            // hitung total income dan expense
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0); // 0 nilai awal sum

            const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            // tambahin baris total di bawah
            worksheet.addRow({});
            const incomeRow = worksheet.addRow({
                no: '', date: '', type: '', category: '',
                wallet: 'Total Pemasukan',
                amount: totalIncome,
                description: ''
            });
            incomeRow.getCell('wallet').font = { bold: true };
            incomeRow.getCell('amount').numFmt = '"Rp "#,##0.00';
            incomeRow.getCell('amount').font = { bold: true, color: { argb: 'FF00AA00' } };

            const expenseRow = worksheet.addRow({
                no: '', date: '', type: '', category: '',
                wallet: 'Total Pengeluaran',
                amount: totalExpense,
                description: ''
            });
            expenseRow.getCell('wallet').font = { bold: true };
            expenseRow.getCell('amount').numFmt = '"Rp "#,##0.00';
            expenseRow.getCell('amount').font = { bold: true, color: { argb: 'FFCC0000' } };

            // set header response biar browser tau ini file excel, kalo engga bakal dianggap response biasa dan muncul di browser
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); // MIME type untuk file Excel
            res.setHeader('Content-Disposition', `attachment; filename=cuansense-laporan-transaksi-${month}-${year}.xlsx`);

            // kirim file langsung ke response tanpa disimpan ke disk
            await workbook.xlsx.write(res); // workbook.xlsx.write() buat nulis workbook ke stream, dalam hal ini streamnya adalah response
            res.end(); // selesai, kirim file ke client

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // =====================
    // EXPORT PDF
    // =====================
    exportPDF: async (req, res) => {
        try {
            const { month, year, wallet_id } = req.query;

            const whereClause = { user_id: req.userId };
            if (wallet_id) whereClause.wallet_id = wallet_id;
            if (month && year) {
                whereClause.transaction_date = {
                    [Op.between]: [
                        new Date(year, month - 1, 1),
                        new Date(year, month, 0, 23, 59, 59)
                    ]
                };
            }

            const transactions = await Transaction.findAll({
                where: whereClause,
                include: [
                    { model: Wallet, as: 'wallet', attributes: ['id', 'name'] },
                    { model: Category, as: 'category', attributes: ['id', 'name'] }
                ],
                order: [['transaction_date', 'DESC']]
            });

            // bikin dokumen PDF baru
            const doc = new PDFDocument({ margin: 40 });

            // set header response biar browser tau ini file PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=cuansense-laporan-transaksi-${month || 'all'}-${year || 'all'}.pdf`);

            // pipe PDF langsung ke response
            doc.pipe(res); // buat stream ke response ( stream : jadi ngirim datanya perbagian )

            // =====================
            // HEADER PDF
            // =====================
            doc.fontSize(20).font('Helvetica-Bold').text('CuanSense', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('Laporan Transaksi Keuangan', { align: 'center' });
            if (month && year) {
                const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                doc.text(`Periode: ${monthNames[month - 1]} ${year}`, { align: 'center' });
            }
            doc.moveDown();
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(); // garis pemisah
            doc.moveDown();

            // =====================
            // SUMMARY
            // =====================
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            doc.fontSize(11).font('Helvetica-Bold').text('Ringkasan:');
            doc.font('Helvetica')
                .text(`Total Pemasukan : Rp ${totalIncome.toLocaleString('id-ID')}`)
                .text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`)
                .text(`Selisih          : Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`); // toLocaleString('id-ID') buat format angka jadi format Indonesia, misal 1000000 jadi 1.000.000
            doc.moveDown();
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(); // garis pemisah
            doc.moveDown();

            // =====================
            // TABEL TRANSAKSI
            // =====================
            // header tabel
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('No', 40, doc.y, { width: 25 });
            doc.text('Tanggal', 65, doc.y - doc.currentLineHeight(), { width: 75 });
            doc.text('Tipe', 140, doc.y - doc.currentLineHeight(), { width: 70 });
            doc.text('Kategori', 210, doc.y - doc.currentLineHeight(), { width: 100 });
            doc.text('Wallet', 310, doc.y - doc.currentLineHeight(), { width: 100 });
            doc.text('Jumlah', 410, doc.y - doc.currentLineHeight(), { width: 145 });
            doc.moveDown(0.5);
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.3);

            // isi tabel
            doc.font('Helvetica').fontSize(9);
            transactions.forEach((trx, index) => {
                // kalau halaman udah mau habis, bikin halaman baru
                if (doc.y > 700) {
                    doc.addPage();
                }

                const y = doc.y; // doc.y : posisi vertikal saat ini
                doc.text(String(index + 1), 40, y, { width: 25 });
                doc.text(new Date(trx.transaction_date).toLocaleDateString('id-ID'), 65, y, { width: 75 });
                doc.text(trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', 140, y, { width: 70 });
                doc.text(trx.category.name, 210, y, { width: 100 });
                doc.text(trx.wallet.name, 310, y, { width: 100 });
                doc.text(`Rp ${parseFloat(trx.amount).toLocaleString('id-ID')}`, 410, y, { width: 145 });
                doc.moveDown(0.8);
            });

            doc.end(); // selesai, kirim PDF

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}