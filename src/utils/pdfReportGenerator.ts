import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Product, Category, User, PromoCode } from '../types';
import { formatKES, formatDateTime, formatKenyanPhone } from './formatters';

interface PDFReportData {
  periodLabel: string;
  adminName: string;
  orders: Order[];
  products: Product[];
  categories: Category[];
  adminUsers: User[];
  promoCodes: PromoCode[];
  grossRevenue: number;
  netSpiritsRevenue: number;
  totalDeliveryFees: number;
  totalDiscountsGiven: number;
  averageOrderValue: number;
  totalBottlesSold: number;
  totalInventoryValuation: number;
  totalStockCount: number;
  categorySales: { categoryName: string; units: number; revenue: number }[];
  topProducts: { productName: string; brand: string; unitsSold: number; revenue: number; currentStock: number }[];
  riderStats: {
    rider: User;
    totalAssigned: number;
    deliveredCount: number;
    revenueHandled: number;
    completionRate: number;
  }[];
}

export const generateExecutiveReportPDF = (data: PDFReportData, reportType: 'full' | 'sales' | 'inventory' | 'logistics' = 'full') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // Colors
  const GOLD = [212, 175, 55]; // #d4af37
  const DARK = [18, 19, 24]; // #121318
  const TEXT_PRIMARY = [30, 30, 35];
  const TEXT_SECONDARY = [100, 100, 110];
  const ACCENT_BG = [248, 247, 244];

  // Helper: Header Banner
  const drawHeader = (title: string, subtitle: string) => {
    // Dark luxury top banner
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(margin, currentY, pageWidth - margin * 2, 26, 'F');

    // Gold accent top bar
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.rect(margin, currentY, pageWidth - margin * 2, 2, 'F');

    // Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BARKWETU CELLAR & RESERVE DISPATCH', margin + 6, currentY + 11);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text(title.toUpperCase(), margin + 6, currentY + 17);

    // Right-aligned report details
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(7.5);
    const dateStr = `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    const periodStr = `Period: ${data.periodLabel}`;
    doc.text(dateStr, pageWidth - margin - 6, currentY + 11, { align: 'right' });
    doc.text(periodStr, pageWidth - margin - 6, currentY + 16, { align: 'right' });
    doc.text(`Hub: Karatina CBD, Nyeri County`, pageWidth - margin - 6, currentY + 21, { align: 'right' });

    currentY += 31;
  };

  // Helper: Section Title
  const drawSectionTitle = (title: string) => {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 16;
    }
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.rect(margin, currentY, 3, 6, 'F');

    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(title, margin + 6, currentY + 4.8);

    doc.setDrawColor(220, 220, 225);
    doc.line(margin + 6 + doc.getTextWidth(title) + 4, currentY + 3.5, pageWidth - margin, currentY + 3.5);
    currentY += 9;
  };

  // 1. Render Header
  let reportTitle = 'Executive Operations & Financial Intelligence Report';
  if (reportType === 'sales') reportTitle = 'Sales Orders & M-Pesa Settlement Audit Report';
  if (reportType === 'inventory') reportTitle = 'Cellar Catalog & Stock Valuation Audit Report';
  if (reportType === 'logistics') reportTitle = 'Delivery Logistics & Rider Performance Report';

  drawHeader(reportTitle, `Timeframe: ${data.periodLabel}`);

  // 2. Render KPI Summary Grid (4 Metric Cards)
  const cardW = (pageWidth - margin * 2 - 9) / 4;
  const cardH = 18;

  const kpis = [
    { label: 'GROSS REVENUE', value: formatKES(data.grossRevenue), note: 'Spirits & Delivery' },
    { label: 'ORDERS PLACED', value: `${data.orders.length} Orders`, note: `${data.totalBottlesSold} bottles sold` },
    { label: 'AVERAGE ORDER', value: formatKES(data.averageOrderValue), note: 'Average spend per drop' },
    { label: 'CELLAR VALUATION', value: formatKES(data.totalInventoryValuation), note: `${data.totalStockCount} bottles in vault` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardW + 3);
    doc.setFillColor(ACCENT_BG[0], ACCENT_BG[1], ACCENT_BG[2]);
    doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'F');

    doc.setDrawColor(225, 220, 210);
    doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'S');

    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(kpi.label, x + 3.5, currentY + 4.5);

    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(kpi.value, x + 3.5, currentY + 10.5);

    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(kpi.note, x + 3.5, currentY + 15);
  });

  currentY += cardH + 7;

  // 3. Render Section Tables based on reportType
  if (reportType === 'full' || reportType === 'sales') {
    // Category Breakdown Table
    drawSectionTitle('Revenue by Spirit Category');
    const catRows = data.categorySales.map((c) => {
      const percentage = data.netSpiritsRevenue > 0 ? Math.round((c.revenue / data.netSpiritsRevenue) * 100) : 0;
      return [c.categoryName, `${c.units} bottles`, formatKES(c.revenue), `${percentage}%`];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Category', 'Units Dispatched', 'Subtotal Revenue (KES)', 'Share (%)']],
      body: catRows.length > 0 ? catRows : [['No data', '-', '-', '-']],
      theme: 'striped',
      headStyles: {
        fillColor: [DARK[0], DARK[1], DARK[2]],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]],
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;

    // Top Selling Spirits Table
    drawSectionTitle('Top-Performing Reserve Spirits');
    const prodRows = data.topProducts.slice(0, 8).map((p, i) => [
      `#${i + 1} ${p.productName}`,
      p.brand,
      `${p.unitsSold} units`,
      formatKES(p.revenue),
      `${p.currentStock} in stock`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Spirit Title', 'Brand', 'Units Sold', 'Gross Revenue (KES)', 'Vault Stock']],
      body: prodRows.length > 0 ? prodRows : [['No bottle sales recorded in period', '-', '-', '-', '-']],
      theme: 'striped',
      headStyles: {
        fillColor: [DARK[0], DARK[1], DARK[2]],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  if (reportType === 'full' || reportType === 'logistics') {
    // Rider Logistics & Fleet Table
    drawSectionTitle('Rider Dispatch & Logistics Performance');
    const riderRows = data.riderStats.map((r) => [
      r.rider.fullName,
      r.rider.bikeRegistration || 'Motorbike',
      formatKenyanPhone(r.rider.phone || ''),
      `${r.totalAssigned}`,
      `${r.deliveredCount}`,
      `${r.completionRate}%`,
      formatKES(r.revenueHandled),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Rider Name', 'Motorbike Reg', 'Phone', 'Assigned', 'Delivered', 'On-Time %', 'Revenue Handled']],
      body: riderRows.length > 0 ? riderRows : [['No rider dispatches in period', '-', '-', '-', '-', '-', '-']],
      theme: 'striped',
      headStyles: {
        fillColor: [DARK[0], DARK[1], DARK[2]],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  if (reportType === 'full' || reportType === 'sales') {
    // Orders Audit Table
    drawSectionTitle(`Orders Audit Log (${data.orders.length} Records)`);
    const orderRows = data.orders.map((o) => [
      `#${o.orderNumber}`,
      formatDateTime(o.createdAt),
      `${o.userName}\n${o.phone}`,
      `${o.shippingAddress?.town || 'Karatina'}`,
      `${o.items.reduce((s, it) => s + it.quantity, 0)} bottles`,
      formatKES(o.total),
      o.status.toUpperCase(),
      o.mpesaDetails?.receiptNumber || 'PENDING',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Order #', 'Date Placed', 'Customer', 'Destination', 'Items', 'Total (KES)', 'Status', 'M-Pesa Receipt']],
      body: orderRows.length > 0 ? orderRows : [['No orders recorded in period', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [DARK[0], DARK[1], DARK[2]],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        textColor: [TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]],
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  if (reportType === 'inventory') {
    // Inventory Full Valuation Table
    drawSectionTitle('Cellar Spirits Catalog & Stock Audit');
    const inventoryRows = data.products.map((p) => [
      p.name,
      p.brand,
      p.categoryName,
      p.volume,
      p.abv,
      formatKES(p.price),
      `${p.stock} units`,
      formatKES(p.price * p.stock),
      p.isActive ? 'Active' : 'Disabled',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Spirit Title', 'Brand', 'Category', 'Vol', 'ABV', 'Price (KES)', 'Stock', 'Asset Value (KES)', 'Status']],
      body: inventoryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [DARK[0], DARK[1], DARK[2]],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        textColor: [TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 225);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    doc.text(
      'BarKwetu Premium Cellar & Fast Delivery · Confidential Internal Report · Karatina Hub',
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  const filename = `BarKwetu_Report_${reportType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
};
