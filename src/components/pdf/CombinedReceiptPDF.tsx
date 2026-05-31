import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#1f2937',
    },
    container: {
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 4,
        padding: 20,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: { width: 56, height: 56, marginRight: 14, objectFit: 'contain' },
    headerContent: { flex: 1 },
    schoolName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#000', marginBottom: 3 },
    addressLine: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
    receiptTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2563eb', marginTop: 4 },

    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    metaText: { fontSize: 10, color: '#374151' },
    metaLabel: { color: '#6b7280' },
    metaValue: { fontFamily: 'Helvetica-Bold', color: '#000' },

    studentBox: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 2,
        marginBottom: 16,
        flexDirection: 'row',
    },
    studentCol: { flex: 1 },
    studentRow: { flexDirection: 'row', marginBottom: 5 },
    label: { color: '#6b7280', width: 60, fontSize: 10 },
    value: { fontFamily: 'Helvetica-Bold', color: '#000', fontSize: 10, flex: 1 },

    table: { marginTop: 4 },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: '#000',
        paddingBottom: 5,
        marginBottom: 4,
        backgroundColor: '#f1f5f9',
        paddingTop: 4,
        paddingHorizontal: 4,
    },
    tableHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#000' },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    tableRowAlt: { backgroundColor: '#f9fafb' },

    colNo:     { width: 22, textAlign: 'center' },
    colReceipt: { width: 110 },
    colDate:   { width: 70 },
    colType:   { flex: 1 },
    colMethod: { width: 50, textAlign: 'center' },
    colAmount: { width: 80, textAlign: 'right' },

    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1.5,
        borderTopColor: '#000',
    },
    totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginRight: 16 },
    totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#16a34a' },

    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 30,
    },
    signLine: {
        width: 120,
        borderTopWidth: 1,
        borderTopColor: '#000',
        textAlign: 'center',
        paddingTop: 4,
        fontSize: 9,
    },
    footerNote: { fontSize: 8, color: '#9ca3af' },
});

interface Props {
    student: any;
    payments: any[];
    logoData?: string;
    schoolSettings?: any;
}

const FEE_LABELS: Record<string, string> = {
    REGISTRATION: 'Registration Fee',
    TUITION:      'Tuition Fee',
    SPORTS:       'Sports & Activity',
    BOOKS:        'Book Fee',
    UNIFORM:      'Uniform & Bag',
    TRANSPORT:    'Transport Fee',
};

export const CombinedReceiptPDF = ({ student, payments, logoData, schoolSettings }: Props) => {
    const branch = student.branch;
    const branchAddress = branch?.address?.trim() || schoolSettings?.address?.trim() || '';
    const branchPhone   = branch?.phone?.trim()   || schoolSettings?.phone?.trim()   || '';
    const branchEmail   = branch?.email?.trim()   || schoolSettings?.email?.trim()   || '';
    const schoolName    = schoolSettings?.schoolName?.trim() || 'Sprout School';
    const branchLabel   = branch?.name?.trim() || null;

    const total = payments.reduce((s: number, p: any) => s + p.amount, 0);
    const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>

                    {/* Header */}
                    <View style={styles.header}>
                        {logoData ? <Image src={logoData} style={styles.logo} /> : null}
                        <View style={styles.headerContent}>
                            <Text style={styles.schoolName}>{schoolName}</Text>
                            {branchAddress ? <Text style={styles.addressLine}>{branchAddress}</Text> : null}
                            {(branchPhone || branchEmail) && (
                                <Text style={styles.addressLine}>
                                    {[branchPhone ? `Ph: ${branchPhone}` : null, branchEmail ? `Email: ${branchEmail}` : null].filter(Boolean).join('   ')}
                                </Text>
                            )}
                            <Text style={styles.receiptTitle}>
                                Combined Fee Receipt{branchLabel ? ` — ${branchLabel}` : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Meta */}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Printed: </Text>
                            <Text style={styles.metaValue}>{printDate}</Text>
                        </Text>
                        <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Total Payments: </Text>
                            <Text style={styles.metaValue}>{payments.length}</Text>
                        </Text>
                    </View>

                    {/* Student info */}
                    <View style={styles.studentBox}>
                        <View style={styles.studentCol}>
                            <View style={styles.studentRow}>
                                <Text style={styles.label}>Name:</Text>
                                <Text style={styles.value}>{student.firstName} {student.lastName}</Text>
                            </View>
                            <View style={styles.studentRow}>
                                <Text style={styles.label}>Class:</Text>
                                <Text style={styles.value}>
                                    {student.class?.name ?? '-'}{student.class?.section ? ` (${student.class.section})` : ''}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.studentCol}>
                            <View style={styles.studentRow}>
                                <Text style={{ ...styles.label, width: 60 }}>Adm No:</Text>
                                <Text style={styles.value}>{student.admissionNo}</Text>
                            </View>
                            <View style={styles.studentRow}>
                                <Text style={{ ...styles.label, width: 60 }}>Parent:</Text>
                                <Text style={styles.value}>{student.parentName || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Payments table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colNo,      styles.tableHeaderCell]}>#</Text>
                            <Text style={[styles.colReceipt, styles.tableHeaderCell]}>Receipt No</Text>
                            <Text style={[styles.colDate,    styles.tableHeaderCell]}>Date</Text>
                            <Text style={[styles.colType,    styles.tableHeaderCell]}>Fee Type</Text>
                            <Text style={[styles.colMethod,  styles.tableHeaderCell]}>Method</Text>
                            <Text style={[styles.colAmount,  styles.tableHeaderCell]}>Amount</Text>
                        </View>

                        {payments.map((p: any, idx: number) => (
                            <View key={p.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                                <Text style={[styles.colNo, { color: '#6b7280' }]}>{idx + 1}</Text>
                                <Text style={[styles.colReceipt, { fontFamily: 'Helvetica', fontSize: 8 }]}>{p.receiptNo ?? '—'}</Text>
                                <Text style={styles.colDate}>
                                    {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                                <Text style={styles.colType}>
                                    {FEE_LABELS[p.fee?.type] ?? p.fee?.type ?? '—'}
                                </Text>
                                <Text style={[styles.colMethod, { color: '#475569' }]}>{p.method}</Text>
                                <Text style={[styles.colAmount, { fontFamily: 'Helvetica-Bold' }]}>
                                    Rs. {p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Total */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Paid:</Text>
                        <Text style={styles.totalValue}>
                            Rs. {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.signLine}>Authorised Signatory</Text>
                        <Text style={styles.footerNote}>Computer generated receipt. No signature required.</Text>
                    </View>

                </View>
            </Page>
        </Document>
    );
};
