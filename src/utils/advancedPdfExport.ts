import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "@/types/api.types";
import { getInvoiceStatus } from "@/utils/invoiceStatus";

interface PdfExportOptions {
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeAnalytics?: boolean;
  colorScheme?: "blue" | "green" | "purple" | "corporate";
  logoUrl?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

export class AdvancedPdfExporter {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private colorScheme: Record<string, string>;

  constructor(private options: PdfExportOptions = {}) {
    this.doc = new jsPDF("p", "mm", "a4");
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.colorScheme = this.getColorScheme(options.colorScheme || "blue");
  }

  private getColorScheme(scheme: string): Record<string, string> {
    const schemes = {
      blue: {
        primary: "#3b82f6",
        secondary: "#1e40af",
        accent: "#60a5fa",
        light: "#dbeafe",
        dark: "#1e3a8a",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      green: {
        primary: "#10b981",
        secondary: "#059669",
        accent: "#34d399",
        light: "#d1fae5",
        dark: "#064e3b",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      purple: {
        primary: "#8b5cf6",
        secondary: "#6d28d9",
        accent: "#a78bfa",
        light: "#ede9fe",
        dark: "#4c1d95",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      corporate: {
        primary: "#1f2937",
        secondary: "#374151",
        accent: "#6b7280",
        light: "#f3f4f6",
        dark: "#111827",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
    };
    return schemes[scheme] || schemes.blue;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  }

  private addNewPage() {
    this.doc.addPage();
    this.currentY = this.margin;
    this.addWatermark();
  }

  private checkPageBreak(requiredSpace: number = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.addNewPage();
    }
  }

  private addWatermark() {
    const [r, g, b] = this.hexToRgb(this.colorScheme.light);
    this.doc.setTextColor(r, g, b);
    this.doc.setFontSize(60);
    this.doc.setFont("helvetica", "bold");
    this.doc.saveGraphicsState();
    this.doc.text("INVOICE", this.pageWidth / 2, this.pageHeight / 2, {
      align: "center",
      angle: 45,
    });
    this.doc.restoreGraphicsState();
    this.doc.setTextColor(0, 0, 0);
  }

  private addGradientHeader() {
    // Primary gradient background
    const [r1, g1, b1] = this.hexToRgb(this.colorScheme.primary);
    const [r2, g2, b2] = this.hexToRgb(this.colorScheme.secondary);

    // Create gradient effect with overlapping rectangles
    for (let i = 0; i < 50; i++) {
      const ratio = i / 50;
      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);
      this.doc.setFillColor(r, g, b);
      this.doc.rect(0, i * 0.8, this.pageWidth, 0.9, "F");
    }

    // Add decorative elements
    const [ar, ag, ab] = this.hexToRgb(this.colorScheme.accent);
    this.doc.setFillColor(ar, ag, ab);
    this.doc.setGState(this.doc.GState({ opacity: 0.2 }));
    this.doc.circle(this.pageWidth - 20, 10, 30, "F");
    this.doc.circle(-10, 30, 25, "F");
    this.doc.setGState(this.doc.GState({ opacity: 1 }));
  }

  private addCompanyHeader() {
    this.addGradientHeader();

    // Company name in white
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont("helvetica", "bold");
    const companyName = this.options.companyInfo?.name || "Your Company Name";
    this.doc.text(companyName, this.margin, 25);

    // Company details
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    let detailY = 32;

    if (this.options.companyInfo) {
      if (this.options.companyInfo.address) {
        this.doc.text(this.options.companyInfo.address, this.margin, detailY);
        detailY += 4;
      }
      if (this.options.companyInfo.phone) {
        this.doc.text(
          `Phone: ${this.options.companyInfo.phone}`,
          this.margin,
          detailY,
        );
        detailY += 4;
      }
      if (this.options.companyInfo.email) {
        this.doc.text(
          `Email: ${this.options.companyInfo.email}`,
          this.margin,
          detailY,
        );
        detailY += 4;
      }
      if (this.options.companyInfo.website) {
        this.doc.text(this.options.companyInfo.website, this.margin, detailY);
      }
    }

    this.doc.setTextColor(0, 0, 0);
    this.currentY = 55;
  }

  private addReportTitle(title: string, subtitle?: string) {
    const [r, g, b] = this.hexToRgb(this.colorScheme.primary);

    // Title background
    this.doc.setFillColor(r, g, b);
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }));
    this.doc.roundedRect(
      this.margin,
      this.currentY - 2,
      this.pageWidth - 2 * this.margin,
      subtitle ? 16 : 10,
      2,
      2,
      "F",
    );
    this.doc.setGState(this.doc.GState({ opacity: 1 }));

    // Title text
    this.doc.setTextColor(r, g, b);
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin + 5, this.currentY + 5);

    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin + 5, this.currentY + 11);
      this.currentY += 20;
    } else {
      this.currentY += 14;
    }

    this.doc.setTextColor(0, 0, 0);
  }

  private addSummaryCards(invoices: Invoice[]) {
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.amount || 0),
      0,
    );
    const paidAmount = invoices
      .filter((inv) => getInvoiceStatus(inv) === "PAID")
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const unpaidAmount = invoices
      .filter((inv) => getInvoiceStatus(inv) === "UNPAID")
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const overdueAmount = invoices
      .filter((inv) => getInvoiceStatus(inv) === "OVERDUE")
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

    const cards = [
      {
        label: "Total Revenue",
        value: totalRevenue,
        color: this.colorScheme.primary,
      },
      { label: "Paid", value: paidAmount, color: this.colorScheme.success },
      {
        label: "Unpaid",
        value: unpaidAmount,
        color: this.colorScheme.warning,
      },
      {
        label: "Overdue",
        value: overdueAmount,
        color: this.colorScheme.danger,
      },
    ];

    const cardWidth = (this.pageWidth - 2 * this.margin - 15) / 4;
    let xPos = this.margin;

    cards.forEach((card, index) => {
      const [r, g, b] = this.hexToRgb(card.color);

      // Card shadow
      this.doc.setFillColor(0, 0, 0);
      this.doc.setGState(this.doc.GState({ opacity: 0.1 }));
      this.doc.roundedRect(
        xPos + 1,
        this.currentY + 1,
        cardWidth,
        22,
        3,
        3,
        "F",
      );
      this.doc.setGState(this.doc.GState({ opacity: 1 }));

      // Card background
      this.doc.setFillColor(255, 255, 255);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, 22, 3, 3, "FD");

      // Color accent bar
      this.doc.setFillColor(r, g, b);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, 4, 3, 3, "F");

      // Label
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(card.label, xPos + cardWidth / 2, this.currentY + 10, {
        align: "center",
      });

      // Value
      this.doc.setTextColor(r, g, b);
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(
        `$${card.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        xPos + cardWidth / 2,
        this.currentY + 18,
        { align: "center" },
      );

      xPos += cardWidth + 5;
    });

    this.currentY += 28;
    this.doc.setTextColor(0, 0, 0);
  }

  private addStatusChart(invoices: Invoice[]) {
    this.checkPageBreak(60);

    const statusCounts = {
      paid: invoices.filter((inv) => getInvoiceStatus(inv) === "PAID").length,
      unpaid: invoices.filter((inv) => getInvoiceStatus(inv) === "UNPAID")
        .length,
      overdue: invoices.filter((inv) => getInvoiceStatus(inv) === "OVERDUE")
        .length,
    };

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    if (total === 0) return;

    // Chart title
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Invoice Status Distribution", this.margin, this.currentY);
    this.currentY += 8;

    // Donut chart
    const centerX = this.margin + 30;
    const centerY = this.currentY + 25;
    const radius = 20;
    const innerRadius = 12;

    const colors = {
      paid: this.colorScheme.success,
      unpaid: this.colorScheme.warning,
      overdue: this.colorScheme.danger,
    };

    let startAngle = -90;

    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count === 0) return;

      const percentage = (count / total) * 100;
      const angle = (percentage / 100) * 360;
      const [r, g, b] = this.hexToRgb(colors[status]);

      // Draw arc
      this.doc.setFillColor(r, g, b);
      this.drawDonutSegment(
        centerX,
        centerY,
        radius,
        innerRadius,
        startAngle,
        startAngle + angle,
      );

      startAngle += angle;
    });

    // Center circle (white)
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(centerX, centerY, innerRadius, "F");

    // Total count in center
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    const [pr, pg, pb] = this.hexToRgb(this.colorScheme.primary);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.text(String(total), centerX, centerY - 2, { align: "center" });

    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text("Total", centerX, centerY + 3, { align: "center" });

    // Legend
    let legendX = this.margin + 70;
    let legendY = this.currentY + 5;

    Object.entries(statusCounts).forEach(([status, count], index) => {
      if (count === 0) return;

      const [r, g, b] = this.hexToRgb(colors[status]);
      const percentage = ((count / total) * 100).toFixed(1);

      // Color box
      this.doc.setFillColor(r, g, b);
      this.doc.roundedRect(legendX, legendY - 3, 4, 4, 0.5, 0.5, "F");

      // Text
      this.doc.setFontSize(9);
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(
        status.charAt(0).toUpperCase() + status.slice(1),
        legendX + 6,
        legendY,
      );

      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`${count} (${percentage}%)`, legendX + 35, legendY);

      legendY += 7;
    });

    this.currentY += 58;
    this.doc.setTextColor(0, 0, 0);
  }

  private drawDonutSegment(
    cx: number,
    cy: number,
    radius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number,
  ) {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const steps = Math.max(20, Math.abs(endAngle - startAngle));

    // Outer arc points
    const outerPoints: number[][] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = startRad + (endRad - startRad) * (i / steps);
      outerPoints.push([
        cx + radius * Math.cos(angle),
        cy + radius * Math.sin(angle),
      ]);
    }

    // Inner arc points (reverse)
    const innerPoints: number[][] = [];
    for (let i = steps; i >= 0; i--) {
      const angle = startRad + (endRad - startRad) * (i / steps);
      innerPoints.push([
        cx + innerRadius * Math.cos(angle),
        cy + innerRadius * Math.sin(angle),
      ]);
    }

    // Draw filled path
    const allPoints = [...outerPoints, ...innerPoints];
    this.doc.lines(
      allPoints
        .slice(1)
        .map((p, i) => [p[0] - allPoints[i][0], p[1] - allPoints[i][1]]),
      allPoints[0][0],
      allPoints[0][1],
      [1, 1],
      "F",
    );
  }

  private addMonthlyChart(invoices: Invoice[]) {
    this.checkPageBreak(70);

    // Group by month
    const monthlyData: Record<string, number> = {};

    invoices.forEach((inv) => {
      if (!inv.issueDate) return;
      const date = new Date(inv.issueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] =
        (monthlyData[monthKey] || 0) + Number(inv.amount || 0);
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    if (sortedMonths.length === 0) return;

    // Chart title
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Monthly Revenue Trend", this.margin, this.currentY);
    this.currentY += 10;

    // Chart dimensions
    const chartWidth = this.pageWidth - 2 * this.margin - 20;
    const chartHeight = 50;
    const chartX = this.margin + 15;
    const chartY = this.currentY;

    // Draw axes
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(chartX, chartY, chartX, chartY + chartHeight); // Y-axis
    this.doc.line(
      chartX,
      chartY + chartHeight,
      chartX + chartWidth,
      chartY + chartHeight,
    ); // X-axis

    // Calculate max value for scaling
    const maxValue = Math.max(...Object.values(monthlyData));
    const barWidth = chartWidth / sortedMonths.length - 2;

    // Draw bars
    sortedMonths.forEach((month, index) => {
      const value = monthlyData[month];
      const barHeight = (value / maxValue) * (chartHeight - 5);
      const x = chartX + index * (chartWidth / sortedMonths.length) + 1;
      const y = chartY + chartHeight - barHeight;

      // Gradient bar
      const [r, g, b] = this.hexToRgb(this.colorScheme.primary);
      this.doc.setFillColor(r, g, b);
      this.doc.setGState(this.doc.GState({ opacity: 0.8 }));
      this.doc.roundedRect(x, y, barWidth, barHeight, 1, 1, "F");
      this.doc.setGState(this.doc.GState({ opacity: 1 }));

      // Month label
      const monthLabel = new Date(month + "-01").toLocaleDateString("en-US", {
        month: "short",
      });
      this.doc.setFontSize(7);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(monthLabel, x + barWidth / 2, chartY + chartHeight + 4, {
        align: "center",
      });

      // Value on top of bar
      if (barHeight > 8) {
        this.doc.setFontSize(6);
        this.doc.setTextColor(255, 255, 255);
        this.doc.text(
          `$${(value / 1000).toFixed(1)}k`,
          x + barWidth / 2,
          y + 3,
          { align: "center" },
        );
      }
    });

    this.currentY += chartHeight + 15;
    this.doc.setTextColor(0, 0, 0);
  }

  private addInvoiceTable(invoices: Invoice[]) {
    this.checkPageBreak(40);

    const tableData = invoices.map((inv) => {
      const status = getInvoiceStatus(inv);
      return [
        inv.invoiceNumber || "N/A",
        inv.client?.fullName || "N/A",
        inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "N/A",
        inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "N/A",
        `$${Number(inv.amount || 0).toFixed(2)}`,
        status,
      ];
    });

    const [pr, pg, pb] = this.hexToRgb(this.colorScheme.primary);
    const [sr, sg, sb] = this.hexToRgb(this.colorScheme.success);
    const [wr, wg, wb] = this.hexToRgb(this.colorScheme.warning);
    const [dr, dg, db] = this.hexToRgb(this.colorScheme.danger);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [
        ["Invoice #", "Client", "Issue Date", "Due Date", "Amount", "Status"],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [pr, pg, pb],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === "body") {
          const status = data.cell.text[0]?.toLowerCase();
          if (status === "paid") {
            data.cell.styles.fillColor = [sr, sg, sb];
            data.cell.styles.textColor = [255, 255, 255];
          } else if (status === "unpaid") {
            data.cell.styles.fillColor = [wr, wg, wb];
            data.cell.styles.textColor = [255, 255, 255];
          } else if (status === "overdue") {
            data.cell.styles.fillColor = [dr, dg, db];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Footer line
      const [r, g, b] = this.hexToRgb(this.colorScheme.primary);
      this.doc.setDrawColor(r, g, b);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.margin,
        this.pageHeight - 15,
        this.pageWidth - this.margin,
        this.pageHeight - 15,
      );

      // Footer text
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        this.margin,
        this.pageHeight - 10,
      );

      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: "right" },
      );
    }
  }

  public async exportInvoices(invoices: Invoice[]): Promise<Blob> {
    // Add watermark to first page
    this.addWatermark();

    // Company header
    this.addCompanyHeader();

    // Report title
    this.addReportTitle(
      "Invoice Report",
      `Comprehensive analysis of ${invoices.length} invoices`,
    );

    // Executive summary cards
    if (this.options.includeSummary !== false) {
      this.addSummaryCards(invoices);
    }

    // Analytics charts
    if (this.options.includeAnalytics !== false) {
      this.addStatusChart(invoices);
      this.addMonthlyChart(invoices);
    }

    // Detailed invoice table starts on a fresh page
    this.addNewPage();
    this.addReportTitle("Detailed Invoice List");
    this.addInvoiceTable(invoices);

    // Add footers to all pages
    this.addFooter();

    // Return blob
    return this.doc.output("blob");
  }
}

// Usage in your export handler
export async function exportInvoicesAdvanced(
  invoices: Invoice[],
  options?: PdfExportOptions,
): Promise<Blob> {
  const exporter = new AdvancedPdfExporter(options);
  return await exporter.exportInvoices(invoices);
}
