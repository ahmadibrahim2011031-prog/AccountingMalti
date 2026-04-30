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
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'NotoSansArabic',
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
  section: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: 10,
    borderBottom: '1px solid #e5e7eb',
  },
  label: {
    fontSize: 14,
    textAlign: 'right',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  netIncomeRow: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  netIncomeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'right',
  },
  netIncomeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
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

interface IncomeStatementData {
  revenue: Array<{ name: string; value: number }>;
  expenses: Array<{ name: string; value: number }>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface DateRange {
  from: string;
  to: string;
}

interface IncomeStatementPDFProps {
  data: IncomeStatementData;
  dateRange: DateRange;
  language: string;
}

export const IncomeStatementPDF: React.FC<IncomeStatementPDFProps> = ({ data, dateRange, language }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src="/malti-logo.png" />
        <Text style={styles.title}>
          {language === 'ar' ? 'قائمة الدخل' : 'Income Statement'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'ar' ? 'أحمد الحاتو' : 'Ahmad Alhato'}
        </Text>
        <Text style={styles.dateRange}>
          {language === 'ar'
            ? `الفترة: ${dateRange.from} - ${dateRange.to}`
            : `Period: ${dateRange.from} - ${dateRange.to}`
          }
        </Text>
      </View>

      {/* Revenue Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'الإيرادات' : 'Revenue'}
        </Text>
        {data.revenue?.filter(item => item).map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.name || 'Unknown'}</Text>
            <Text style={[styles.value, { color: '#10b981' }]}>
              {language === 'ar'
                ? `${(item.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(item.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'مجموع الإيرادات' : 'Total Revenue'}
          </Text>
          <Text style={[styles.value, { color: '#10b981' }]}>
            {language === 'ar'
              ? `${data.totalRevenue.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalRevenue.toLocaleString()}`
            }
          </Text>
        </View>
      </View>

      {/* Expenses Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'المصروفات' : 'Expenses'}
        </Text>
        {data.expenses?.filter(item => item).map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.name || 'Unknown'}</Text>
            <Text style={[styles.value, { color: '#ef4444' }]}>
              {language === 'ar'
                ? `${(item.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(item.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'مجموع المصروفات' : 'Total Expenses'}
          </Text>
          <Text style={[styles.value, { color: '#ef4444' }]}>
            {language === 'ar'
              ? `${data.totalExpenses.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalExpenses.toLocaleString()}`
            }
          </Text>
        </View>
      </View>

      {/* Net Income */}
      <View style={styles.netIncomeRow}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
          <Text style={styles.netIncomeLabel}>
            {language === 'ar' ? 'صافي الربح/الخسارة' : 'Net Income/Loss'}
          </Text>
          <Text style={styles.netIncomeValue}>
            {language === 'ar'
              ? `${data.netIncome.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.netIncome.toLocaleString()}`
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
