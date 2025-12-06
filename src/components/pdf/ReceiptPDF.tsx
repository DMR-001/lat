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
    // Outer Border Container
    container: {
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 4,
        padding: 20,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
        // No line here in image, line is after address? No, image has line after meta or inside. 
        // Image shows: Logo | Receipt Title | Address block.
        // Actually, Logo is Left. "Receipt" is next to it?
        // Let's look closer at description: "Logo on left... Receipt title... Address". 
        // We will layout: [Logo] [Vertical Stack: Receipt, Address]
        alignItems: 'center'
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 15,
        objectFit: 'contain'
    },
    headerContent: {
        flex: 1
    },
    receiptTitle: {
        fontSize: 20,
        fontWeight: 'bold', // Helvetica-Bold
        color: '#000000',
        marginBottom: 4
    },
    addressLine: {
        fontSize: 9,
        color: '#6b7280',
        marginBottom: 2
    },

    // Receipt No & Date Row
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    metaText: {
        fontSize: 10,
        color: '#374151'
    },
    metaLabel: {
        color: '#6b7280'
    },
    metaValue: {
        fontWeight: 'bold', // Helvetica-Bold
        color: '#000000'
    },

    // Student Box
    studentBox: {
        backgroundColor: '#f8fafc', // Light slate/gray
        padding: 10,
        borderRadius: 2,
        marginBottom: 20,
        flexDirection: 'row'
    },
    studentCol: {
        flex: 1
    },
    studentRow: {
        flexDirection: 'row',
        marginBottom: 6
    },
    label: {
        color: '#6b7280',
        width: 50,
        fontSize: 10
    },
    value: {
        color: '#000000',
        fontWeight: 'bold', // Helvetica-Bold
        fontSize: 10
    },

    // Table
    table: {
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 4,
        marginBottom: 8
    },
    tableHeaderCell: {
        fontWeight: 'bold', // Helvetica-Bold
        fontSize: 10,
        color: '#000000'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 8,
        marginBottom: 8
    },
    colDesc: {
        flex: 1,
        textAlign: 'left'
    },
    colAmount: {
        width: 100,
        textAlign: 'right'
    },

    // Total
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
        alignItems: 'center'
    },
    totalLabel: {
        fontWeight: 'bold', // Helvetica-Bold
        marginRight: 20,
        fontSize: 11
    },
    totalValue: {
        fontWeight: 'bold', // Helvetica-Bold
        fontSize: 12
    },

    // Footer
    footer: {
        marginTop: 'auto', // Push to bottom of container
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 40
    },
    signLine: {
        width: 120,
        borderTopWidth: 1,
        borderTopColor: '#000000',
        textAlign: 'center',
        paddingTop: 4,
        fontSize: 9
    },
    footerNote: {
        fontSize: 9,
        color: '#9ca3af'
    }
});

interface ReceiptPDFProps {
    payment: any;
    logoData?: string;
}

export const ReceiptPDF = ({ payment, logoData }: ReceiptPDFProps) => {
    const student = payment.fee.student;

    return (
        <Document>
            <Page size="A4" style={styles.page} orientation="landscape">
                {/* Note: Standard receipt is usually landscape or half-A4. 
                But image looks like a card. Let's stick to Portrait A4 but draw the container box. 
                Actually, image implies a constrained box. 
                Let's use Portrait A4 but the container will give the "card" look. */}

                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        {logoData && <Image src={logoData} style={styles.logo} />}
                        <View style={styles.headerContent}>
                            <Text style={styles.receiptTitle}>Receipt</Text>
                            <Text style={styles.addressLine}>Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad</Text>
                            <Text style={styles.addressLine}>Ph: +91 7032252030  Email: sproutmeerpet@gmail.com</Text>
                        </View>
                    </View>

                    {/* Meta Info */}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Receipt No: </Text>
                            <Text style={styles.metaValue}>{payment.receiptNo}</Text>
                        </Text>
                        <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Date: </Text>
                            <Text style={styles.metaValue}>{new Date(payment.date).toLocaleDateString()}</Text>
                        </Text>
                    </View>

                    {/* Student Info */}
                    <View style={styles.studentBox}>
                        <View style={styles.studentCol}>
                            <View style={styles.studentRow}>
                                <Text style={styles.label}>Name:</Text>
                                <Text style={styles.value}>{student.firstName} {student.lastName}</Text>
                            </View>
                            <View style={styles.studentRow}>
                                <Text style={styles.label}>Class:</Text>
                                <Text style={styles.value}>
                                    {student.class?.name} {student.class?.section ? `(${student.class.section})` : ''}
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
                                <Text style={styles.value}>{student.parentName || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colDesc, styles.tableHeaderCell]}>Description</Text>
                            <Text style={[styles.colAmount, styles.tableHeaderCell]}>Amount</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.colDesc}>
                                {payment.fee.type} Fee <Text style={{ color: '#6b7280', fontSize: 9 }}>({payment.method})</Text>
                            </Text>
                            <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>
                                {payment.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </Text>
                        </View>
                    </View>

                    {/* Total */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>
                            {payment.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.signLine}>Sign</Text>
                        <Text style={styles.footerNote}>Computer generated receipt.</Text>
                    </View>

                </View>
            </Page>
        </Document>
    );
};
