import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#1f2937',
    },
    container: {
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 4,
        padding: 12,
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: { width: 44, height: 44, marginRight: 10, objectFit: 'contain' },
    headerContent: { flex: 1 },
    schoolName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#000', marginBottom: 2 },
    addressLine: { fontSize: 8, color: '#6b7280', marginBottom: 1 },
    receiptTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#2563eb', marginTop: 3 },

    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingTop: 7,
        paddingBottom: 7,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    metaText: { fontSize: 9, color: '#374151' },
    metaLabel: { color: '#6b7280' },
    metaValue: { fontFamily: 'Helvetica-Bold', color: '#000' },

    studentBox: {
        backgroundColor: '#f8fafc',
        padding: 7,
        borderRadius: 2,
        marginBottom: 10,
        flexDirection: 'row',
    },
    studentCol: { flex: 1 },
    studentRow: { flexDirection: 'row', marginBottom: 3 },
    label: { color: '#6b7280', width: 50, fontSize: 8 },
    value: { fontFamily: 'Helvetica-Bold', color: '#000', fontSize: 8, flex: 1 },

    table: { marginTop: 2 },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: '#000',
        paddingBottom: 4,
        marginBottom: 3,
        backgroundColor: '#f1f5f9',
        paddingTop: 3,
        paddingHorizontal: 3,
    },
    tableHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#000' },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 4,
        paddingHorizontal: 3,
    },
    tableRowAlt: { backgroundColor: '#f9fafb' },

    colNo:      { width: 16, textAlign: 'center' },
    colReceipt: { width: 90 },
    colDate:    { width: 55 },
    colType:    { flex: 1 },
    colMethod:  { width: 38, textAlign: 'center' },
    colAmount:  { width: 65, textAlign: 'right' },

    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 7,
        paddingTop: 6,
        borderTopWidth: 1.5,
        borderTopColor: '#000',
    },
    totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginRight: 12 },
    totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#16a34a' },

    footer: {
        marginTop: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    signLine: {
        width: 100,
        borderTopWidth: 1,
        borderTopColor: '#000',
        textAlign: 'center',
        paddingTop: 3,
        fontSize: 8,
    },
    footerNote: { fontSize: 7, color: '#9ca3af' },
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
            <Page size="A5" orientation="landscape" style={styles.page}>
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
                        <Text style={styles.signLine}>Signature</Text>
                        <Text style={styles.footerNote}>Computer generated receipt.</Text>
                    </View>

                </View>
            </Page>
        </Document>
    );
};
