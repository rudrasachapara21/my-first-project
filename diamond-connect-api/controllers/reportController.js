const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const db = require('../db'); 

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- GRAPHICS HELPERS ---
const drawDiamondLogo = (doc, x, y, size = 20) => {
    doc.save();
    doc.translate(x, y);
    // Draw a stylized diamond shape
    doc.moveTo(0, -size)
       .lineTo(size * 0.8, -size * 0.3)
       .lineTo(size, 0)
       .lineTo(0, size)
       .lineTo(-size, 0)
       .lineTo(-size * 0.8, -size * 0.3)
       .closePath();
    
    // Gradient-like fill (Deep Blue to Lighter Blue)
    const grad = doc.linearGradient(-size, -size, size, size);
    grad.stop(0, '#38BDF8').stop(1, '#0EA5E9');
    doc.fill(grad);
    
    // Internal Facets (White lines for detail)
    doc.lineWidth(0.5).strokeColor('white').strokeOpacity(0.4);
    doc.moveTo(-size * 0.8, -size * 0.3).lineTo(size * 0.8, -size * 0.3).stroke(); 
    doc.moveTo(0, -size).lineTo(0, size).stroke(); 
    doc.moveTo(-size, 0).lineTo(size, 0).stroke(); 
    doc.restore();
};

const drawBadge = (doc, text, x, y, color) => {
    const width = doc.widthOfString(text) + 16;
    const height = 14;
    
    doc.save();
    // Pill Background
    doc.roundedRect(x, y - 4, width, height, 7).fillColor(color).fillOpacity(0.1).fill();
    // Text
    doc.fillColor(color).fillOpacity(1).fontSize(8).font('Helvetica-Bold').text(text, x + 8, y - 2);
    doc.restore();
};

exports.generateStatement = async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;
        const userId = req.user ? (req.user.user_id || req.user.id) : null;
        if (!userId) return res.status(401).json({ message: "Unauthorized." });

        console.log(`📄 Generating PREMIUM STATEMENT for User: ${userId}`);

        // 1. FETCH USER DETAILS
        const userRes = await db.query(`SELECT full_name, role, gst_number, email FROM users WHERE user_id = $1`, [userId]);
        const user = userRes.rows[0] || {};
        const userName = user.full_name || 'Valued Client';
        const userRole = user.role || 'trader';

        // 2. FETCH TRANSACTIONS (Using the new POWER TABLE)
        // This ensures the PDF matches your "Financials" Dashboard perfectly.
        const query = `
            SELECT t.*, 
                   l.shape, l.carat, l.color, l.clarity,
                   u_buyer.full_name as buyer_name,
                   u_seller.full_name as seller_name
            FROM transactions t
            LEFT JOIN listings l ON t.listing_id = l.listing_id
            LEFT JOIN users u_buyer ON t.buyer_id = u_buyer.user_id
            LEFT JOIN users u_seller ON t.seller_id = u_seller.user_id
            WHERE (t.buyer_id = $1 OR t.seller_id = $1)
              AND t.transaction_date::date >= $2 AND t.transaction_date::date <= $3
            ORDER BY t.transaction_date DESC
        `;

        const { rows } = await db.query(query, [userId, startDate, endDate]);

        let allActivity = [];
        let totalValue = 0;

        // Process Data for the Report
        rows.forEach(t => {
            const isSeller = t.seller_id === userId;
            const type = isSeller ? 'SOLD' : 'PURCHASED';
            
            // Define colors based on activity
            let badgeColor = '#64748B'; // Grey default
            if (type === 'SOLD') badgeColor = '#2563EB'; // Blue
            if (type === 'PURCHASED') badgeColor = '#059669'; // Green

            allActivity.push({
                date: t.transaction_date,
                type: type,
                badge_color: badgeColor,
                shape: t.shape || 'Diamond',
                weight: t.carat || '-',
                color: t.color || '-',
                clarity: t.clarity || '-',
                price: t.final_amount,
                counterparty_name: isSeller ? t.buyer_name : t.seller_name,
                counterparty_role: isSeller ? 'Buyer' : 'Seller'
            });

            totalValue += Number(t.final_amount || 0);
        });

        const totalDeals = allActivity.length;

        // --- PDF GENERATION ---
        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 0, size: 'A4' }); 
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Statement_${startDate}.pdf`);
            doc.pipe(res);

            // 1. BRANDED HEADER BACKGROUND
            doc.rect(0, 0, 600, 120).fillColor('#0F172A').fill(); // Dark Navy
            
            // Subtle Pattern
            doc.save();
            doc.fillColor('#1E293B'); 
            for(let i=0; i<600; i+=30) { doc.circle(i, 20, 2).fill(); doc.circle(i+15, 40, 2).fill(); }
            doc.restore();

            // Logo & Title
            drawDiamondLogo(doc, 50, 45, 18);
            
            doc.font('Helvetica-Bold').fontSize(22).fillColor('white').text('Diamond Connect', 80, 35);
            doc.font('Helvetica').fontSize(10).fillColor('#94A3B8').text('THE TRUSTED TRADING NETWORK', 80, 62);

            // Statement Period
            doc.fontSize(9).fillColor('#CBD5E1').text('STATEMENT PERIOD', 400, 35, { align: 'right', width: 150 });
            doc.font('Helvetica-Bold').fontSize(11).fillColor('white').text(`${formatDate(startDate)} - ${formatDate(endDate)}`, 400, 48, { align: 'right', width: 150 });

            // 2. USER DETAILS CARD
            const cardY = 140;
            doc.fillColor('black');
            
            // Left: User Info
            doc.font('Helvetica-Bold').fontSize(14).text(userName, 50, cardY);
            doc.font('Helvetica').fontSize(10).fillColor('#64748B').text(`Role: ${userRole.toUpperCase()}`, 50, cardY + 18);
            doc.text(`GST: ${user.gst_number || 'N/A'}`, 50, cardY + 32);
            doc.text(`Email: ${user.email || 'N/A'}`, 50, cardY + 46);

            // Right: Summary Stats
            const boxY = cardY - 5;
            
            // Box 1: Total Deals
            doc.roundedRect(300, boxY, 110, 60, 8).fillColor('#F1F5F9').fill();
            doc.fillColor('#64748B').fontSize(8).text('TOTAL DEALS', 315, boxY + 15);
            doc.fillColor('#0F172A').fontSize(18).font('Helvetica-Bold').text(totalDeals, 315, boxY + 30);

            // Box 2: Total Volume
            doc.roundedRect(420, boxY, 130, 60, 8).fillColor('#F0F9FF').fill();
            doc.fillColor('#0369A1').fontSize(8).font('Helvetica').text('NET VOLUME', 435, boxY + 15);
            doc.fillColor('#0284C7').fontSize(16).font('Helvetica-Bold').text(formatCurrency(totalValue), 435, boxY + 30);

            // 3. TRANSACTION TABLE
            const tableTop = 240;
            const colX = { date: 50, type: 130, details: 220, party: 380, price: 500 };

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A').text('Transaction History', 50, 215);

            // Table Header Bar
            doc.roundedRect(40, tableTop, 515, 25, 4).fillColor('#0F172A').fill();
            doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
            doc.text('DATE', colX.date, tableTop + 8);
            doc.text('ACTIVITY', colX.type, tableTop + 8);
            doc.text('ITEM DETAILS', colX.details, tableTop + 8);
            doc.text('COUNTERPARTY', colX.party, tableTop + 8);
            doc.text('VALUE', colX.price, tableTop + 8);

            let currentY = tableTop + 35;
            let rowCount = 0;

            allActivity.forEach((row) => {
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }

                if (rowCount % 2 === 0) {
                    doc.rect(40, currentY - 5, 515, 30).fillColor('#F8FAFC').fill();
                }
                
                doc.fillColor('#334155').font('Helvetica').fontSize(9);
                doc.text(formatDate(row.date), colX.date, currentY);

                drawBadge(doc, row.type, colX.type, currentY, row.badge_color);

                doc.fillColor('#0F172A').font('Helvetica-Bold');
                doc.text(`${row.weight}ct ${row.shape}`, colX.details, currentY);
                doc.font('Helvetica').fontSize(8).fillColor('#64748B');
                doc.text(`${row.color} / ${row.clarity}`, colX.details, currentY + 12);

                doc.fontSize(9).fillColor('#334155');
                doc.text(row.counterparty_name || 'N/A', colX.party, currentY, { width: 100, ellipsis: true });
                doc.fontSize(8).fillColor('#94A3B8').text(row.counterparty_role, colX.party, currentY + 12);

                doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A');
                doc.text(formatCurrency(row.price), colX.price, currentY);

                currentY += 35;
                rowCount++;
            });

            if (allActivity.length === 0) {
                doc.moveDown(4);
                doc.font('Helvetica').fontSize(10).fillColor('#94A3B8').text('No transactions found for this period.', { align: 'center' });
            }

            // Footer
            const bottomY = 780;
            doc.lineWidth(1).strokeColor('#E2E8F0').moveTo(40, bottomY - 10).lineTo(555, bottomY - 10).stroke();
            doc.fontSize(8).fillColor('#94A3B8').text('Diamond Connect Inc. | generated electronically', 50, bottomY);
            doc.text(`Page 1`, 500, bottomY, { align: 'right' });

            doc.end();
        } 
        // --- EXCEL OUTPUT ---
        else {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Transactions');
            
            sheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Item', key: 'item', width: 25 },
                { header: 'Weight', key: 'weight', width: 12 },
                { header: 'Amount', key: 'price', width: 15 },
                { header: 'Counterparty', key: 'party', width: 25 }
            ];

            allActivity.forEach(a => {
                sheet.addRow({
                    date: formatDate(a.date),
                    type: a.type,
                    item: `${a.shape} (${a.color}/${a.clarity})`,
                    weight: a.weight,
                    price: a.price,
                    party: a.counterparty_name
                });
            });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Statement.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        }

    } catch (error) {
        console.error("❌ REPORT ERROR:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};