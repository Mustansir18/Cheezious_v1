'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { DailySale } from '@/components/reporting/DailySalesReport';
import type { HourlySale } from '@/components/reporting/HourlySalesReport';
import type { ItemSale, DealSale, CategorySale } from '@/lib/types';
import type { OrderTypeData } from '@/components/reporting/OrderTypeSummary';
import type { OrderAdjustmentData } from '@/components/reporting/OrderAdjustmentsSummary';
import type { PaymentData } from '@/components/reporting/PaymentMethodBreakdown';


declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

// --- CSV Generation ---

function arrayToCsv(data: any[], columns: { key: string, label: string }[]): string {
    const header = columns.map(c => c.label).join(',') + '\n';
    const rows = data.map(row => {
        return columns.map(c => {
            let value = row[c.key];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        }).join(',');
    }).join('\n');
    return header + rows;
}


// --- Individual Report Generators ---

export const exportTopItemsAs = (format: 'pdf' | 'csv', data: (ItemSale | DealSale)[], title: string) => {
    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'quantity', label: 'Quantity Sold' },
        { key: 'totalRevenue', label: 'Total Revenue (RS)' },
    ];
    
    if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(title, 14, 20);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item.name, item.quantity, Math.round(item.totalRevenue)]),
            startY: 25
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
};


export const exportCategorySalesAs = (format: 'pdf' | 'csv', data: CategorySale[]) => {
    const title = 'Sales by Category';
    const columns = [
        { key: 'name', label: 'Category' },
        { key: 'sales', label: 'Total Sales (RS)' },
    ];

    if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(title, 14, 20);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item.name, Math.round(item.sales)]),
            startY: 25
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
};

export const exportChartDataAs = (format: 'pdf' | 'csv', data: (HourlySale[] | DailySale[]), title: string, xKey: string, yKey: string) => {
    const columns = [
        { key: xKey, label: title === 'Hourly Sales' ? 'Hour' : 'Date' },
        { key: yKey, label: 'Sales (RS)' },
    ];
    
    if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(title, 14, 20);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item[xKey as keyof typeof item], Math.round(item[yKey as keyof typeof item] as number)]),
            startY: 25
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
};

export const exportSummaryAs = (format: 'pdf' | 'csv', data: { title: string, value: string | number }[]) => {
    const title = 'Overall Summary';
    const columns = [
        { key: 'title', label: 'Metric' },
        { key: 'value', label: 'Value' },
    ];

    if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(title, 14, 20);
        doc.autoTable({
            head: [columns.map(c => c.label)],
            body: data.map(item => [item.title, item.value]),
            startY: 25
        });
        doc.save(`${title.toLowerCase().replace(/\s/g, '-')}.pdf`);
    } else {
        const csv = arrayToCsv(data, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${title.toLowerCase().replace(/\s/g, '-')}.csv`);
    }
}

// --- Comprehensive ZIP Exporter ---

export const exportAllReportsAsZip = async (reportData: any, dateDisplay: string) => {
    const zip = new JSZip();
    const folder = zip.folder(`cheezious-sales-report-${dateDisplay.replace(/ /g, '_')}`);

    if (!folder) return;

    // Summary
    const summaryCsv = arrayToCsv(reportData.summaryCards, [{key: 'title', label: 'Metric'}, {key: 'value', label: 'Value'}]);
    folder.file('01-summary.csv', summaryCsv);
    
    // Top Items
    const topItemsCsv = arrayToCsv(reportData.topSellingItems, [{key: 'name', label: 'Item'}, {key: 'quantity', label: 'Quantity'}, {key: 'totalRevenue', label: 'Revenue'}]);
    folder.file('02-top-selling-items.csv', topItemsCsv);
    
    // Top Deals
    const topDealsCsv = arrayToCsv(reportData.topSellingDeals, [{key: 'name', label: 'Deal'}, {key: 'quantity', label: 'Quantity'}, {key: 'totalRevenue', label: 'Revenue'}]);
    folder.file('03-top-selling-deals.csv', topDealsCsv);

    // Category Sales
    const categorySalesCsv = arrayToCsv(reportData.categoryChartData, [{key: 'name', label: 'Category'}, {key: 'sales', label: 'Sales'}]);
    folder.file('04-category-sales.csv', categorySalesCsv);

    // Hourly Sales
    const hourlySalesCsv = arrayToCsv(reportData.hourlySalesChartData, [{key: 'hour', label: 'Hour'}, {key: 'sales', label: 'Sales'}]);
    folder.file('05-hourly-sales.csv', hourlySalesCsv);

    // Daily Sales
    const dailySalesCsv = arrayToCsv(reportData.dailySalesChartData, [{key: 'date', label: 'Date'}, {key: 'sales', label: 'Sales'}]);
    folder.file('06-daily-sales.csv', dailySalesCsv);

    // Payment Methods
    const paymentMethodsCsv = arrayToCsv(reportData.paymentChartData, [{key: 'method', label: 'Method'}, {key: 'sales', label: 'Sales'}]);
    folder.file('07-payment-methods.csv', paymentMethodsCsv);

    // Order Types
    const orderTypesCsv = arrayToCsv(reportData.orderTypeChartData, [{key: 'type', label: 'Type'}, {key: 'count', label: 'Orders'}, {key: 'sales', label: 'Sales'}]);
    folder.file('08-order-types.csv', orderTypesCsv);

    // Adjustments
    const adjustmentsCsv = arrayToCsv(reportData.adjustmentChartData, [{key: 'type', label: 'Type'}, {key: 'count', label: 'Count'}]);
    folder.file('09-order-adjustments.csv', adjustmentsCsv);


    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `cheezious-sales-report-${dateDisplay.replace(/ /g, '_')}.zip`);
}
