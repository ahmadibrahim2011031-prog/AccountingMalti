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
  summaryRow: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'right',
  },
  summaryValue: {
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

interface CashFlowData {
  operating: Array<{ name: string; value: number }>;
  investing: Array<{ name: string; value: number }>;
  financing: Array<{ name: string; value: number }>;
  totalOperating: number;
  totalInvesting: number;
  totalFinancing: number;
  netCashFlow: number;
}

interface DateRange {
  from: string;
  to: string;
}

interface CashFlowPDFProps {
  data: CashFlowData;
  dateRange: DateRange;
  language: string;
}

export const CashFlowPDF: React.FC<CashFlowPDFProps> = ({ data, dateRange, language }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src="/malti-logo.png" />
        <Text style={styles.title}>
          {language === 'ar' ? 'قائمة التدفقات النقدية' : 'Cash Flow Statement'}
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

      {/* Operating Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'الأنشطة التشغيلية' : 'Operating Activities'}
        </Text>
        {data.operating?.filter(item => item).map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.name || 'Unknown'}</Text>
            <Text style={[styles.value, { color: (item.value || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
              {language === 'ar'
                ? `${(item.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(item.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'صافي التدفق من الأنشطة التشغيلية' : 'Net Cash from Operating'}
          </Text>
          <Text style={[styles.value, { color: data.totalOperating >= 0 ? '#10b981' : '#ef4444' }]}>
            {language === 'ar'
              ? `${data.totalOperating.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalOperating.toLocaleString()}`
            }
          </Text>
        </View>
      </View>

      {/* Investing Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'الأنشطة الاستثمارية' : 'Investing Activities'}
        </Text>
        {data.investing?.filter(item => item).map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.name || 'Unknown'}</Text>
            <Text style={[styles.value, { color: (item.value || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
              {language === 'ar'
                ? `${(item.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(item.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'صافي التدفق من الأنشطة الاستثمارية' : 'Net Cash from Investing'}
          </Text>
          <Text style={[styles.value, { color: data.totalInvesting >= 0 ? '#10b981' : '#ef4444' }]}>
            {language === 'ar'
              ? `${data.totalInvesting.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalInvesting.toLocaleString()}`
            }
          </Text>
        </View>
      </View>

      {/* Financing Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'الأنشطة التمويلية' : 'Financing Activities'}
        </Text>
        {data.financing?.filter(item => item).map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.name || 'Unknown'}</Text>
            <Text style={[styles.value, { color: (item.value || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
              {language === 'ar'
                ? `${(item.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(item.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'صافي التدفق من الأنشطة التمويلية' : 'Net Cash from Financing'}
          </Text>
          <Text style={[styles.value, { color: data.totalFinancing >= 0 ? '#10b981' : '#ef4444' }]}>
            {language === 'ar'
              ? `${data.totalFinancing.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalFinancing.toLocaleString()}`
            }
          </Text>
        </View>
      </View>

      {/* Net Cash Flow */}
      <View style={styles.summaryRow}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
          <Text style={styles.summaryLabel}>
            {language === 'ar' ? 'صافي التدفق النقدي' : 'Net Cash Flow'}
          </Text>
          <Text style={styles.summaryValue}>
            {language === 'ar'
              ? `${data.netCashFlow.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.netCashFlow.toLocaleString()}`
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
