import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register Arabic font - Using Noto Sans Arabic which is more reliable
Font.register({
  family: 'NotoSansArabic',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@4.5.11/files/noto-sans-arabic-arabic-400-normal.woff',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@4.5.11/files/noto-sans-arabic-arabic-700-normal.woff',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansArabic',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '2px solid #333',
    paddingBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  dateRange: {
    fontSize: 12,
    color: '#888',
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#6366f1',
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
  },
  tableCell: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
  },
  totalRow: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
});

interface TrialBalanceAccount {
  number: string;
  name: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
}

interface DateRange {
  from: string;
  to: string;
}

interface TrialBalancePDFProps {
  data: TrialBalanceData;
  dateRange: DateRange;
  language: string;
}

export const TrialBalancePDF: React.FC<TrialBalancePDFProps> = ({ data, dateRange, language }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src="/malti-logo.png" />
        <Text style={styles.title}>
          {language === 'ar' ? 'ميزان المراجعة' : 'Trial Balance'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'ar' ? 'مالتي للمحاسبة' : 'Malti Accounting'}
        </Text>
        <Text style={styles.dateRange}>
          {language === 'ar'
            ? `الفترة: ${dateRange.from} - ${dateRange.to}`
            : `Period: ${dateRange.from} - ${dateRange.to}`
          }
        </Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 0.5 }]}>
            {language === 'ar' ? 'رقم الحساب' : 'Account #'}
          </Text>
          <Text style={[styles.tableCell, { flex: 2 }]}>
            {language === 'ar' ? 'اسم الحساب' : 'Account Name'}
          </Text>
          <Text style={styles.tableCell}>
            {language === 'ar' ? 'مدين' : 'Debit'}
          </Text>
          <Text style={styles.tableCell}>
            {language === 'ar' ? 'دائن' : 'Credit'}
          </Text>
        </View>

        {data.accounts?.filter(account => account).map((account, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 0.5 }]}>{account.number || ''}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{account.name || 'Unknown'}</Text>
            <Text style={styles.tableCell}>
              {account.debit
                ? language === 'ar'
                  ? (account.debit || 0).toLocaleString('ar-QA')
                  : (account.debit || 0).toLocaleString()
                : '-'
              }
            </Text>
            <Text style={styles.tableCell}>
              {account.credit
                ? language === 'ar'
                  ? (account.credit || 0).toLocaleString('ar-QA')
                  : (account.credit || 0).toLocaleString()
                : '-'
              }
            </Text>
          </View>
        ))}

        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={[styles.tableCell, { flex: 2.5 }]}>
            {language === 'ar' ? 'المجموع' : 'Total'}
          </Text>
          <Text style={styles.tableCell}>
            {language === 'ar'
              ? data.totalDebit.toLocaleString('ar-QA')
              : data.totalDebit.toLocaleString()
            }
          </Text>
          <Text style={styles.tableCell}>
            {language === 'ar'
              ? data.totalCredit.toLocaleString('ar-QA')
              : data.totalCredit.toLocaleString()
            }
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>
          {language === 'ar'
            ? `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-QA')}`
            : `Generated: ${new Date().toLocaleDateString()}`
          }
        </Text>
      </View>
    </Page>
  </Document>
);
