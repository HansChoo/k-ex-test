
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const printReceipt = async (reservation: any, user: any) => {
    // Fetch Receipt Settings
    const settingsRef = doc(db, "settings", "receipt_config");
    const settingsSnap = await getDoc(settingsRef);
    const config = settingsSnap.exists() ? settingsSnap.data() : {
        companyName: "K-Experience Corp.",
        address: "Gangnam-gu, Seoul, Korea",
        ceo: "Lee Ho Seon",
        regNo: "123-45-67890",
        logoUrl: "//ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/category/logo/v2_eeb789877378fab1385e25cce7da0111_7qvKZ1ZSa9_top.jpg"
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - ${reservation.id}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .logo { height: 40px; margin-bottom: 10px; }
                .title { font-size: 24px; font-weight: bold; margin: 10px 0; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .total { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; line-height: 1.5; }
                .stamp { text-align: right; margin-top: 40px; position: relative; }
                .stamp-box { display: inline-block; border: 1px solid #ddd; padding: 10px 30px; font-size: 12px; color: #aaa; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                ${config.logoUrl ? `<img src="${config.logoUrl}" class="logo" />` : ''}
                <div class="title">OFFICIAL RECEIPT</div>
                <div style="font-size: 12px; color: #666;">Document No. ${reservation.id}</div>
            </div>

            <div class="meta">
                <div>
                    <strong>Supplier:</strong><br>
                    ${config.companyName}<br>
                    ${config.address}<br>
                    Reg No: ${config.regNo}<br>
                    CEO: ${config.ceo}
                </div>
                <div style="text-align: right;">
                    <strong>Customer:</strong><br>
                    ${user.name || user.displayName || 'Guest'}<br>
                    ${user.email}<br>
                    Date: ${new Date().toLocaleDateString()}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Reservation Details</div>
                <div class="row"><span>Product</span><span>${reservation.productName}</span></div>
                <div class="row"><span>Reservation Date</span><span>${reservation.date}</span></div>
                <div class="row"><span>Participants</span><span>${reservation.peopleCount} Person(s)</span></div>
            </div>

            <div class="section">
                <div class="section-title">Payment Info</div>
                <div class="row"><span>Payment Method</span><span>Credit Card (Paid)</span></div>
                <div class="row"><span>Status</span><span>${reservation.status.toUpperCase()}</span></div>
                <div class="total">
                    <span>TOTAL AMOUNT</span>
                    <span>KRW ${Number(reservation.totalPrice).toLocaleString()}</span>
                </div>
            </div>

            <div class="footer">
                <p>This document verifies that the payment has been completed.<br>
                ${config.footerText || "Thank you for choosing K-Experience."}</p>
                <div class="stamp">
                    <div class="stamp-box">(Electronically Signed)</div>
                </div>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer;">PRINT NOW</button>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
