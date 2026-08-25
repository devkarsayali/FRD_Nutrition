import React, { useRef } from "react";
import { FiPrinter, FiDownload, FiX, FiCheckCircle } from "react-icons/fi";
import logoImg from "../../assets/OIP1.jpg";

export default function OfflineSaleBillModal({ isOpen, onClose, sale }) {
  const printRef = useRef();

  if (!isOpen || !sale) return null;

  // Format Bill Number: FRD-OFF-000001
  const getBillNumber = () => {
    if (sale.billNumber) return sale.billNumber;
    let rawNum = "1";
    if (sale.id) {
      const match = sale.id.match(/\d+/g);
      if (match && match.length > 0) {
        rawNum = match.join("").slice(-6);
      } else {
        rawNum = String(sale.id).slice(-6);
      }
    }
    const padded = String(rawNum).padStart(6, "0");
    return `FRD-OFF-${padded}`;
  };

  const billNumber = getBillNumber();

  // Helper date formatter
  const formatDate = (dateStr) => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return new Date().toLocaleString();
    }
  };

  // Resolve absolute URL for logo image so standalone popup/blob HTML can render it without 404
  const getAbsoluteLogoUrl = () => {
    if (!logoImg) return "";
    if (logoImg.startsWith("http") || logoImg.startsWith("data:")) return logoImg;
    return new URL(logoImg, window.location.origin).href;
  };

  const absoluteLogoUrl = getAbsoluteLogoUrl();
  const items = Array.isArray(sale.items) ? sale.items : [];
  const rawSubtotal = sale.subtotal ?? items.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
  const discount = Number(sale.discount) || 0;
  const finalTotal = Number(sale.totalAmount) ?? Math.max(0, rawSubtotal - discount);

  // Standard Print / PDF Action (Top Header)
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Offline Retail Invoice - ${billNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #ffffff; color: #0f172a; font-size: 13px; line-height: 1.5; }
            .invoice-page { width: 210mm; min-height: 297mm; padding: 15mm 18mm; margin: 0 auto; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; }
            .header-table { width: 100%; border-bottom: 2.5px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
            .logo-cell { width: 80px; vertical-align: top; }
            .logo-img { width: 68px; height: 68px; object-fit: contain; border-radius: 10px; background: #0f172a; padding: 4px; display: block; }
            .store-cell { vertical-align: top; padding-left: 14px; }
            .store-title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0 0 3px 0; letter-spacing: -0.3px; }
            .store-info { font-size: 11px; color: #475569; line-height: 1.45; font-weight: 500; }
            .meta-cell { vertical-align: top; text-align: right; width: 220px; }
            .badge-tag { display: inline-block; background: #84cc16; color: #0f172a; font-weight: 900; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 16px; margin-bottom: 6px; }
            .bill-no { font-family: monospace; font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; }
            .bill-date { font-size: 11px; color: #64748b; margin-top: 2px; }
            .details-table { width: 100%; border-spacing: 14px 0; margin: 0 -14px 20px -14px; }
            .details-card { width: 50%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; vertical-align: top; }
            .card-heading { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; }
            .row-flex { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .lbl { color: #64748b; font-weight: 500; }
            .val { font-weight: 700; color: #0f172a; }
            .paid-text { color: #16a34a; font-weight: 900; }
            .products-table-wrap { border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
            .products-table { width: 100%; border-collapse: collapse; }
            .products-table th { background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 12px; text-align: left; }
            .products-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
            .products-table tr:last-child td { border-bottom: none; }
            .products-table tr:nth-child(even) td { background: #f8fafc; }
            .summary-table-wrap { width: 100%; margin-bottom: 24px; }
            .summary-box { width: 280px; margin-left: auto; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; }
            .sum-row { display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 5px; }
            .grand-total-row { display: flex; justify-content: space-between; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 8px; font-size: 15px; font-weight: 900; color: #0f172a; }
            .footer-section { text-align: center; border-top: 1.5px dashed #cbd5e1; padding-top: 16px; margin-top: auto; }
            .paid-badge { display: inline-block; background: #dcfce7; color: #15803d; border: 2px solid #22c55e; padding: 4px 18px; border-radius: 6px; font-weight: 900; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px; }
            .thank-title { font-size: 12px; font-weight: 700; color: #1e293b; margin: 0 0 3px 0; }
            .foot-note { font-size: 10px; color: #94a3b8; margin: 0; }
          </style>
        </head>
        <body>
          <div class="invoice-page">
            <div>
              <table class="header-table">
                <tr>
                  <td class="logo-cell"><img src="${absoluteLogoUrl}" alt="FRD Logo" class="logo-img" /></td>
                  <td class="store-cell">
                    <h1 class="store-title">FRD NUTRITION STORE</h1>
                    <div class="store-info">
                      Physical Fitness & Sports Store Outlet<br />
                      FRD Nutrition, Dev Colony Gali 1, Delhi Road, Rohtak, Haryana 124001<br />
                      Phone: +91 90880 32004 | GSTIN: 27AAAAA0000A1Z5
                    </div>
                  </td>
                  <td class="meta-cell">
                    <span class="badge-tag">OFFLINE RETAIL INVOICE</span>
                    <div class="bill-no">${billNumber}</div>
                    <div class="bill-date">Date: ${formatDate(sale.saleDate)}</div>
                  </td>
                </tr>
              </table>

              <table class="details-table">
                <tr>
                  <td class="details-card">
                    <div class="card-heading">CUSTOMER DETAILS</div>
                    <div class="row-flex"><span class="lbl">Customer Name:</span><span class="val">${sale.customer?.name || "Walk-in Customer"}</span></div>
                    <div class="row-flex"><span class="lbl">Phone Number:</span><span class="val" style="font-family: monospace;">${sale.customer?.phone && sale.customer.phone !== "N/A" ? sale.customer.phone : "N/A"}</span></div>
                  </td>
                  <td class="details-card">
                    <div class="card-heading">TRANSACTION DETAILS</div>
                    <div class="row-flex"><span class="lbl">Bill Number:</span><span class="val" style="font-family: monospace;">${billNumber}</span></div>
                    <div class="row-flex"><span class="lbl">Payment Method:</span><span class="val">${sale.paymentMethod || "Cash"}</span></div>
                    <div class="row-flex"><span class="lbl">Payment Status:</span><span class="val paid-text">PAID</span></div>
                  </td>
                </tr>
              </table>

              <div class="products-table-wrap">
                <table class="products-table">
                  <thead>
                    <tr>
                      <th style="width: 35px;">#</th>
                      <th>Product Description</th>
                      <th style="text-align: right; width: 100px;">Price</th>
                      <th style="text-align: center; width: 60px;">Qty</th>
                      <th style="text-align: right; width: 90px;">Discount</th>
                      <th style="text-align: right; width: 120px;">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((it, idx) => {
      const itemDisc = Number(it.itemDiscount) || 0;
      const itemTotal = Number(it.price) * Number(it.quantity) - itemDisc;
      return `
                        <tr>
                          <td style="font-family: monospace; color: #94a3b8;">${idx + 1}</td>
                          <td><strong>${it.name}</strong><div style="font-size: 10px; color: #64748b;">${it.category || "Supplement"}</div></td>
                          <td style="text-align: right; font-family: monospace;">₹${it.price}</td>
                          <td style="text-align: center; font-family: monospace; font-weight: 700;">${it.quantity}</td>
                          <td style="text-align: right; font-family: monospace; color: #d97706;">${itemDisc > 0 ? `-₹${itemDisc}` : "₹0"}</td>
                          <td style="text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">₹${itemTotal}</td>
                        </tr>
                      `;
    }).join("")}
                  </tbody>
                </table>
              </div>

              <div class="summary-table-wrap">
                <div class="summary-box">
                  <div class="sum-row"><span>Subtotal:</span><span style="font-family: monospace; font-weight: 700; color: #0f172a;">₹${rawSubtotal}</span></div>
                  ${discount > 0 ? `<div class="sum-row" style="color: #d97706; font-weight: 600;"><span>Total Discount:</span><span style="font-family: monospace;">-₹${discount}</span></div>` : ""}
                  <div class="sum-row" style="font-size: 11px;"><span>GST / Tax (Included):</span><span style="font-family: monospace;">₹0.00</span></div>
                  <div class="grand-total-row"><span>Grand Total:</span><span style="font-family: monospace; color: #65a30d;">₹${finalTotal.toLocaleString("en-IN")}</span></div>
                </div>
              </div>
            </div>

            <div class="footer-section">
              <div class="paid-badge">✔ PAYMENT: PAID</div>
              <div class="thank-title">Thank you for shopping at FRD Nutrition Store! Keep pushing your limits! 💪</div>
              <p class="foot-note">This is an official computer-generated offline store receipt.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Automatic File Download Action (Only for Download / Print Bill button)
  const handleDownloadPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Offline Retail Invoice - ${billNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #ffffff; color: #0f172a; font-size: 13px; line-height: 1.5; }
            .invoice-page { width: 210mm; min-height: 297mm; padding: 15mm 18mm; margin: 0 auto; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; }
            .header-table { width: 100%; border-bottom: 2.5px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
            .logo-cell { width: 80px; vertical-align: top; }
            .logo-img { width: 68px; height: 68px; object-fit: contain; border-radius: 10px; background: #0f172a; padding: 4px; display: block; }
            .store-cell { vertical-align: top; padding-left: 14px; }
            .store-title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0 0 3px 0; letter-spacing: -0.3px; }
            .store-info { font-size: 11px; color: #475569; line-height: 1.45; font-weight: 500; }
            .meta-cell { vertical-align: top; text-align: right; width: 220px; }
            .badge-tag { display: inline-block; background: #84cc16; color: #0f172a; font-weight: 900; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 16px; margin-bottom: 6px; }
            .bill-no { font-family: monospace; font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; }
            .bill-date { font-size: 11px; color: #64748b; margin-top: 2px; }
            .details-table { width: 100%; border-spacing: 14px 0; margin: 0 -14px 20px -14px; }
            .details-card { width: 50%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; vertical-align: top; }
            .card-heading { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; }
            .row-flex { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .lbl { color: #64748b; font-weight: 500; }
            .val { font-weight: 700; color: #0f172a; }
            .paid-text { color: #16a34a; font-weight: 900; }
            .products-table-wrap { border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
            .products-table { width: 100%; border-collapse: collapse; }
            .products-table th { background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 12px; text-align: left; }
            .products-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
            .products-table tr:last-child td { border-bottom: none; }
            .products-table tr:nth-child(even) td { background: #f8fafc; }
            .summary-table-wrap { width: 100%; margin-bottom: 24px; }
            .summary-box { width: 280px; margin-left: auto; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; }
            .sum-row { display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 5px; }
            .grand-total-row { display: flex; justify-content: space-between; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 8px; font-size: 15px; font-weight: 900; color: #0f172a; }
            .footer-section { text-align: center; border-top: 1.5px dashed #cbd5e1; padding-top: 16px; margin-top: auto; }
            .paid-badge { display: inline-block; background: #dcfce7; color: #15803d; border: 2px solid #22c55e; padding: 4px 18px; border-radius: 6px; font-weight: 900; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px; }
            .thank-title { font-size: 12px; font-weight: 700; color: #1e293b; margin: 0 0 3px 0; }
            .foot-note { font-size: 10px; color: #94a3b8; margin: 0; }
          </style>
        </head>
        <body>
          <div class="invoice-page">
            <div>
              <table class="header-table">
                <tr>
                  <td class="logo-cell"><img src="${absoluteLogoUrl}" alt="FRD Logo" class="logo-img" /></td>
                  <td class="store-cell">
                    <h1 class="store-title">FRD NUTRITION STORE</h1>
                    <div class="store-info">
                      Physical Fitness & Sports Store Outlet<br />
                      FRD Nutrition, Dev Colony Gali 1, Delhi Road, Rohtak, Haryana 124001<br />
                      Phone: +91 90880 32004 | GSTIN: 27AAAAA0000A1Z5
                    </div>
                  </td>
                  <td class="meta-cell">
                    <span class="badge-tag">OFFLINE RETAIL INVOICE</span>
                    <div class="bill-no">${billNumber}</div>
                    <div class="bill-date">Date: ${formatDate(sale.saleDate)}</div>
                  </td>
                </tr>
              </table>

              <table class="details-table">
                <tr>
                  <td class="details-card">
                    <div class="card-heading">CUSTOMER DETAILS</div>
                    <div class="row-flex"><span class="lbl">Customer Name:</span><span class="val">${sale.customer?.name || "Walk-in Customer"}</span></div>
                    <div class="row-flex"><span class="lbl">Phone Number:</span><span class="val" style="font-family: monospace;">${sale.customer?.phone && sale.customer.phone !== "N/A" ? sale.customer.phone : "N/A"}</span></div>
                  </td>
                  <td class="details-card">
                    <div class="card-heading">TRANSACTION DETAILS</div>
                    <div class="row-flex"><span class="lbl">Bill Number:</span><span class="val" style="font-family: monospace;">${billNumber}</span></div>
                    <div class="row-flex"><span class="lbl">Payment Method:</span><span class="val">${sale.paymentMethod || "Cash"}</span></div>
                    <div class="row-flex"><span class="lbl">Payment Status:</span><span class="val paid-text">PAID</span></div>
                  </td>
                </tr>
              </table>

              <div class="products-table-wrap">
                <table class="products-table">
                  <thead>
                    <tr>
                      <th style="width: 35px;">#</th>
                      <th>Product Description</th>
                      <th style="text-align: right; width: 100px;">Price</th>
                      <th style="text-align: center; width: 60px;">Qty</th>
                      <th style="text-align: right; width: 90px;">Discount</th>
                      <th style="text-align: right; width: 120px;">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((it, idx) => {
      const itemDisc = Number(it.itemDiscount) || 0;
      const itemTotal = Number(it.price) * Number(it.quantity) - itemDisc;
      return `
                        <tr>
                          <td style="font-family: monospace; color: #94a3b8;">${idx + 1}</td>
                          <td><strong>${it.name}</strong><div style="font-size: 10px; color: #64748b;">${it.category || "Supplement"}</div></td>
                          <td style="text-align: right; font-family: monospace;">₹${it.price}</td>
                          <td style="text-align: center; font-family: monospace; font-weight: 700;">${it.quantity}</td>
                          <td style="text-align: right; font-family: monospace; color: #d97706;">${itemDisc > 0 ? `-₹${itemDisc}` : "₹0"}</td>
                          <td style="text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">₹${itemTotal}</td>
                        </tr>
                      `;
    }).join("")}
                  </tbody>
                </table>
              </div>

              <div class="summary-table-wrap">
                <div class="summary-box">
                  <div class="sum-row"><span>Subtotal:</span><span style="font-family: monospace; font-weight: 700; color: #0f172a;">₹${rawSubtotal}</span></div>
                  ${discount > 0 ? `<div class="sum-row" style="color: #d97706; font-weight: 600;"><span>Total Discount:</span><span style="font-family: monospace;">-₹${discount}</span></div>` : ""}
                  <div class="sum-row" style="font-size: 11px;"><span>GST / Tax (Included):</span><span style="font-family: monospace;">₹0.00</span></div>
                  <div class="grand-total-row"><span>Grand Total:</span><span style="font-family: monospace; color: #65a30d;">₹${finalTotal.toLocaleString("en-IN")}</span></div>
                </div>
              </div>
            </div>

            <div class="footer-section">
              <div class="paid-badge">✔ PAYMENT: PAID</div>
              <div class="thank-title">Thank you for shopping at FRD Nutrition Store! Keep pushing your limits! 💪</div>
              <p class="foot-note">This is an official computer-generated offline store receipt.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${billNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#141813] border border-neutral-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 shadow-2xl space-y-4 sm:space-y-6 text-white my-auto max-h-[96vh] overflow-y-auto">
        {/* Action Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-2">
          <div className="truncate">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-lime-400 block">
              Official POS Invoice
            </span>
            <h2 className="font-heading text-xs sm:text-lg font-bold text-white truncate">
              Offline Sale Bill ({billNumber})
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-lime-500 hover:bg-lime-400 text-neutral-950 font-black text-[11px] sm:text-xs transition cursor-pointer shadow-md shadow-lime-500/20"
            >
              <FiPrinter size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Professional Retail POS Invoice Card Preview */}
        <div className="bg-white text-neutral-900 p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-neutral-200 shadow-xl space-y-4 sm:space-y-6">
          <div ref={printRef}>
            {/* Header: Store Branding & Invoice Title */}
            <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-neutral-900 pb-4 mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={logoImg}
                  alt="FRD Nutrition Logo"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain bg-neutral-950 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-neutral-800 shrink-0"
                />
                <div>
                  <h1 className="text-base sm:text-xl font-extrabold text-neutral-900 tracking-tight leading-none mb-1">
                    FRD NUTRITION STORE
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 leading-relaxed font-medium">
                    Physical Fitness & Sports Store Outlet<br />
                    FRD Nutrition, Dev Colony Gali 1, Delhi Road, Rohtak, Haryana 124001<br />
                    Phone: +91 90880 32004 | GSTIN: 27AAAAA0000A1Z5
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-lime-400 text-neutral-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-full shadow-sm mb-1">
                  OFFLINE RETAIL INVOICE
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-neutral-900">
                  {billNumber}
                </p>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">
                  Date: {formatDate(sale.saleDate)}
                </p>
              </div>
            </div>

            {/* Side-by-side Cards: Customer Details (Left) vs Transaction Details (Right) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Left Card: Customer Details (Name & Phone ONLY) */}
              <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl space-y-1 sm:space-y-2">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 block">
                  CUSTOMER DETAILS
                </span>
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Customer Name:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[170px]">
                      {sale.customer?.name || "Walk-in Customer"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Phone Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {sale.customer?.phone && sale.customer.phone !== "N/A"
                        ? sale.customer.phone
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Card: Transaction Details */}
              <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 sm:space-y-2">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 block">
                  TRANSACTION DETAILS
                </span>
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Bill Number:</span>
                    <span className="font-mono font-bold text-slate-900">{billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Payment Method:</span>
                    <span className="font-bold text-slate-900">{sale.paymentMethod || "Cash"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Payment Status:</span>
                    <span className="font-extrabold text-emerald-600 uppercase">PAID</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Purchased Table */}
            <div className="border border-slate-200 rounded-lg sm:rounded-xl overflow-x-auto mb-4 sm:mb-6">
              <table className="w-full text-left text-xs border-collapse min-w-[420px] sm:min-w-[500px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-2 sm:p-3">#</th>
                    <th className="p-2 sm:p-3">Product Description</th>
                    <th className="p-2 sm:p-3 text-right">Price</th>
                    <th className="p-2 sm:p-3 text-center">Qty</th>
                    <th className="p-2 sm:p-3 text-right">Discount</th>
                    <th className="p-2 sm:p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-[11px] sm:text-xs">
                  {items.map((it, idx) => {
                    const itemDisc = Number(it.itemDiscount) || 0;
                    const itemTotal = Number(it.price) * Number(it.quantity) - itemDisc;
                    return (
                      <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/60" : ""}>
                        <td className="p-2 sm:p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 sm:p-3 font-bold text-slate-900">
                          {it.name}
                          <span className="block text-[9px] sm:text-[10px] font-normal text-slate-500">
                            {it.category || "Supplement"}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-right font-mono text-slate-700">₹{it.price}</td>
                        <td className="p-2 sm:p-3 text-center font-mono font-bold text-slate-900">{it.quantity}</td>
                        <td className="p-2 sm:p-3 text-right font-mono text-amber-600">
                          {itemDisc > 0 ? `-₹${itemDisc}` : "₹0"}
                        </td>
                        <td className="p-2 sm:p-3 text-right font-mono font-bold text-slate-900">
                          ₹{itemTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary Box */}
            <div className="flex justify-end mb-4 sm:mb-6">
              <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-mono text-slate-900 font-bold">₹{rawSubtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Total Discount:</span>
                    <span className="font-mono">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-[10px] sm:text-[11px]">
                  <span>GST / Tax (Included):</span>
                  <span className="font-mono">₹0.00</span>
                </div>
                <div className="flex justify-between border-t-2 border-slate-900 pt-2 font-black text-xs sm:text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-lime-600 text-base sm:text-lg">
                    ₹{finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Stamp & Message */}
            <div className="text-center border-t border-dashed border-slate-300 pt-4 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border-2 border-emerald-600 font-black tracking-widest text-[10px] sm:text-xs uppercase rounded-lg shadow-sm">
                <FiCheckCircle size={14} />
                <span>PAYMENT: PAID</span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-800">
                Thank you for shopping at FRD Nutrition Store! Keep pushing your limits! 💪
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-400">
                This is an official computer-generated offline store receipt.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 border-t border-neutral-800 pt-3 text-xs">
          <span className="text-neutral-400 font-medium text-center sm:text-left text-[11px] sm:text-xs">
            POS Retail Bill Ready
          </span>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-bold transition cursor-pointer text-[11px] sm:text-xs"
            >
              <FiDownload size={14} className="text-lime-400" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-lime-500 hover:bg-lime-400 text-neutral-950 font-black transition cursor-pointer uppercase tracking-wider text-center text-[11px] sm:text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
