

'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { DailySale } from '@/components/reporting/DailySalesReport';
import type { HourlySale } from '@/app/marketing/reporting/page';
import type { ItemSale, DealSale, CategorySale, Order } from '@/lib/types';
import type { OrderTypeData } from '@/components/reporting/OrderTypeSummary';
import type { OrderAdjustmentData } from '@/components/reporting/OrderAdjustmentsSummary';
import type { PaymentData } from '@/components/reporting/PaymentMethodBreakdown';


declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

interface ReportHeaderInfo {
    companyName: string;
    branchName: string;
    dateDisplay?: string;
}

function addReportHeader(doc: jsPDF, title: string, headerInfo: ReportHeaderInfo) {
    doc.setFontSize(18);
    doc.text(headerInfo.companyName, 14, 22);
    doc.setFontSize(12);
    doc.text(headerInfo.branchName, 14, 30);
    doc.setFontSize(16);
    doc.text(title, 14, 40);
    if(headerInfo.dateDisplay) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${headerInfo.dateDisplay}`, 14, 48);
    }
}


// --- CSV Generation ---

function arrayToCsv(data: any[], columns: { key: string, label: string }[]): string {
    const header = columns.map(c => c.label).join(',') + '\n';
    const rows = data.map(row => {
        return columns.map(c => {
            let value = row[c.key];
             if (typeof value === 'number') {
                value = Math.round(value);
            }
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    }).join('\n');
    return header + rows;
}


// --- Individual Report Generators ---

export const exportOrderTypeDetailsAs = (format: 'pdf' | 'csv', orders: Order[], titleSuffix: string, headerInfo: ReportHeaderInfo) => {
    const title = `${titleSuffix} Order Details`;
    const columns = [
        { key: 'orderNumber', label: 'Order #' },
        { key: 'orderType', label: 'Type' },
        { key: 'orderDate', label: 'Created' },
        { key: 'completionDate', label: 'Completed' },
        { key: 'totalAmount', label: 'Price (RS)' },
        { key: 'paymentMethod', label: 'Payment' },
        { key: 'items', label: 'Items' },
    ];

    const data = orders.map(o => ({
        ...o,
        orderDate: new Date(o.orderDate).toLocaleString(),
        completionDate: o.completionDate ? new Date(o.completionDate).toLocaleString() : 'N/A',
        items: o.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
    }));

    if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'landscape' });
        addReportHeader(doc, title, headerInfo);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(row => columns.map(c => (row as any)[c.key])),
            startY: 55,
            styles: { fontSize: 8 },
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
};


export const exportTopItemsAs = (format: 'pdf' | 'csv', data: (ItemSale | DealSale)[], title: string, headerInfo?: ReportHeaderInfo) => {
    const columns = [
        { key: 'id', label: 'Unique Code'},
        { key: 'name', label: 'Name' },
        { key: 'quantity', label: 'Quantity Sold' },
        { key: 'totalRevenue', label: 'Total Revenue (RS)' },
    ];
    
    if (format === 'pdf' && headerInfo) {
        const doc = new jsPDF();
        addReportHeader(doc, title, headerInfo);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item.id, item.name, item.quantity, Math.round(item.totalRevenue)]),
            startY: 55
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
};


export const exportCategorySalesAs = (format: 'pdf' | 'csv', data: CategorySale[], headerInfo?: ReportHeaderInfo) => {
    const title = 'Sales by Category';
    const columns = [
        { key: 'id', label: 'Unique Code'},
        { key: 'name', label: 'Category' },
        { key: 'sales', label: 'Total Sales (RS)' },
    ];

    if (format === 'pdf' && headerInfo) {
        const doc = new jsPDF();
        addReportHeader(doc, title, headerInfo);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item.id, item.name, Math.round(item.sales)]),
            startY: 55
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
};

export const exportChartDataAs = (format: 'pdf' | 'csv', data: (HourlySale[] | DailySale[]), title: string, xKey: string, yKey: string, headerInfo?: ReportHeaderInfo) => {
    const columns = [
        { key: xKey, label: title === 'Hourly Sales' ? 'Hour' : 'Date' },
        { key: yKey, label: 'Sales (RS)' },
    ];
    
    if (format === 'pdf' && headerInfo) {
        const doc = new jsPDF();
        addReportHeader(doc, title, headerInfo);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item[xKey as keyof typeof item], Math.round(item[yKey as keyof typeof item] as number)]),
            startY: 55
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
};

export const exportSummaryAs = (format: 'pdf' | 'csv', data: { title: string, value: string | number }[], headerInfo?: ReportHeaderInfo) => {
    const title = 'Overall Summary';
    const columns = [
        { key: 'title', label: 'Metric' },
        { key: 'value', label: 'Value' },
    ];

    if (format === 'pdf' && headerInfo) {
        const doc = new jsPDF();
        addReportHeader(doc, title, headerInfo);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item.title, item.value]),
            startY: 55
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
}

// --- Comprehensive ZIP Exporter ---

export const exportAllReportsAsZip = async (reportData: any) => {
    const { companyName, branchName, dateDisplay } = reportData;
    const zip = new JSZip();
    const folderName = `cheezious-report-${branchName.replace(/\s/g, '_')}-${dateDisplay.replace(/ /g, '_')}`;
    const folder = zip.folder(folderName);

    if (!folder) return;
    
    let reportText = `${companyName} - ${branchName}\nSales Report for ${dateDisplay}\n\n`;

    // Summary
    reportText += '--- Overall Summary ---\n';
    reportText += 'Metric,Value\n';
    reportData.summaryCards.forEach((d: any) => reportText += `${d.title},${d.value}\n`);
    reportText += '\n';

    // Top Items
    reportText += '--- Top Selling Items ---\n';
    reportText += 'Unique Code,Item,Quantity,Revenue\n';
    reportData.topSellingItems.forEach((d: any) => reportText += `${d.id},"${d.name}",${d.quantity},${Math.round(d.totalRevenue)}\n`);
    reportText += '\n';
    
    // Top Deals
    reportText += '--- Top Selling Deals ---\n';
    reportText += 'Unique Code,Deal,Quantity,Revenue\n';
    reportData.topSellingDeals.forEach((d: any) => reportText += `${d.id},"${d.name}",${d.quantity},${Math.round(d.totalRevenue)}\n`);
    reportText += '\n';

    // Category Sales
    reportText += '--- Sales by Category ---\n';
    reportText += 'Unique Code,Category,Sales\n';
    reportData.categoryChartData.forEach((d: any) => reportText += `${d.id},"${d.name}",${Math.round(d.sales)}\n`);
    reportText += '\n';

    // Hourly Sales
    reportText += '--- Hourly Sales ---\n';
    reportText += 'Hour,Sales\n';
    reportData.hourlySalesChartData.forEach((d: any) => reportText += `${d.hour},${Math.round(d.sales)}\n`);
    reportText += '\n';

    // Daily Sales
    reportText += '--- Daily Sales ---\n';
    reportText += 'Date,Sales\n';
    reportData.dailySalesChartData.forEach((d: any) => reportText += `${d.date},${Math.round(d.sales)}\n`);
    reportText += '\n';

    // Payment Methods
    reportText += '--- Sales by Payment Method ---\n';
    reportText += 'Method,Sales\n';
    reportData.paymentChartData.forEach((d: any) => reportText += `${d.method},${Math.round(d.sales)}\n`);
    reportText += '\n';

    // Order Types
    reportText += '--- Sales by Order Type ---\n';
    reportText += 'Type,Orders,Sales\n';
    reportData.orderTypeChartData.forEach((d: any) => reportText += `${d.type},${d.count},${Math.round(d.sales)}\n`);
    reportText += '\n';

    // Adjustments
    reportText += '--- Order Adjustments ---\n';
    reportText += 'Type,Count\n';
    reportData.adjustmentChartData.forEach((d: any) => reportText += `${d.type},${d.count}\n`);
    reportText += '\n';

    folder.file('summary_report.txt', reportText);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${folderName}.zip`);
}
