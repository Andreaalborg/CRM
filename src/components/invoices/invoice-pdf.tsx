"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

// Registrer font
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_0.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_0.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_0.woff2", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  companyInfo: {
    maxWidth: "50%",
  },
  companyName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#6366f1",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#666666",
    textAlign: "right",
    marginTop: 4,
  },
  customerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "1 solid #e5e7eb",
  },
  customerInfo: {
    maxWidth: "45%",
  },
  label: {
    fontSize: 8,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: 2,
  },
  customerDetails: {
    fontSize: 10,
    color: "#4a4a4a",
    lineHeight: 1.5,
  },
  invoiceDetails: {
    textAlign: "right",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: "#666666",
    width: 80,
  },
  detailValue: {
    fontSize: 10,
    fontWeight: 600,
    color: "#1a1a1a",
    width: 100,
    textAlign: "right",
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottom: "1 solid #f3f4f6",
  },
  colDescription: {
    flex: 3,
  },
  colQuantity: {
    flex: 1,
    textAlign: "center",
  },
  colUnit: {
    flex: 1,
    textAlign: "center",
  },
  colPrice: {
    flex: 1.5,
    textAlign: "right",
  },
  colAmount: {
    flex: 1.5,
    textAlign: "right",
  },
  totalsSection: {
    marginLeft: "auto",
    width: 220,
    marginBottom: 40,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: "1 solid #f3f4f6",
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    backgroundColor: "#6366f1",
    borderRadius: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: "#4a4a4a",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  totalLabelFinal: {
    fontSize: 12,
    fontWeight: 600,
    color: "#ffffff",
  },
  totalValueFinal: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
  },
  paymentSection: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  paymentDetails: {
    fontSize: 10,
    color: "#4a4a4a",
    lineHeight: 1.6,
  },
  notes: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: "#92400e",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#78350f",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  statusBadge: {
    position: "absolute",
    top: 40,
    right: 40,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusPaid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusOverdue: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
});

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  amount: number | string;
  unit?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerCity?: string;
  customerPostalCode?: string;
  customerCountry?: string;
  customerOrgNumber?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number | string;
  vatRate: number | string;
  vatAmount: number | string;
  total: number | string;
  paidAmount?: number | string;
  status: string;
  notes?: string;
  bankAccount?: string;
  paymentTerms?: string;
  reference?: string;
  organization: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    organizationNumber?: string;
    website?: string;
  };
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
  }).format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("nb-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function InvoicePDF({ invoice }: { invoice: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status badge for betalt/forfalt */}
        {invoice.status === "PAID" && (
          <View style={[styles.statusBadge, styles.statusPaid]}>
            <Text style={{ fontSize: 10, fontWeight: 600 }}>BETALT</Text>
          </View>
        )}
        {invoice.status === "OVERDUE" && (
          <View style={[styles.statusBadge, styles.statusOverdue]}>
            <Text style={{ fontSize: 10, fontWeight: 600 }}>FORFALT</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{invoice.organization.name}</Text>
            <Text style={styles.companyDetails}>
              {invoice.organization.address && `${invoice.organization.address}\n`}
              {invoice.organization.postalCode && invoice.organization.city && 
                `${invoice.organization.postalCode} ${invoice.organization.city}\n`}
              {invoice.organization.phone && `Tlf: ${invoice.organization.phone}\n`}
              {invoice.organization.organizationNumber && 
                `Org.nr: ${invoice.organization.organizationNumber}`}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FAKTURA</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Customer & Invoice Details */}
        <View style={styles.customerSection}>
          <View style={styles.customerInfo}>
            <Text style={styles.label}>Faktureres til</Text>
            <Text style={styles.customerName}>{invoice.customerName}</Text>
            <Text style={styles.customerDetails}>
              {invoice.customerAddress && `${invoice.customerAddress}\n`}
              {invoice.customerPostalCode && invoice.customerCity && 
                `${invoice.customerPostalCode} ${invoice.customerCity}\n`}
              {invoice.customerEmail}
              {invoice.customerOrgNumber && `\nOrg.nr: ${invoice.customerOrgNumber}`}
            </Text>
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fakturadato:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Forfallsdato:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
            {invoice.reference && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Deres ref:</Text>
                <Text style={styles.detailValue}>{invoice.reference}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Beskrivelse</Text>
            <Text style={[styles.tableHeaderText, styles.colQuantity]}>Antall</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Enhet</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Pris</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Beløp</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit || "stk"}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>MVA ({invoice.vatRate}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.vatAmount)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Å betale</Text>
            <Text style={styles.totalValueFinal}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Betalingsinformasjon</Text>
          <Text style={styles.paymentDetails}>
            {invoice.bankAccount && `Kontonummer: ${invoice.bankAccount}\n`}
            {`KID/Referanse: ${invoice.invoiceNumber}\n`}
            {invoice.paymentTerms || "Betalingsfrist: 14 dager"}
          </Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Merknad</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {invoice.organization.name} • {invoice.organization.website || ""}
        </Text>
      </Page>
    </Document>
  );
}

// Funksjon for å generere PDF blob
export async function generateInvoicePDF(invoice: InvoiceData): Promise<Blob> {
  const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
  return blob;
}

// Funksjon for å laste ned PDF
export async function downloadInvoicePDF(invoice: InvoiceData) {
  const blob = await generateInvoicePDF(invoice);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `faktura-${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}



