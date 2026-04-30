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

interface BalanceSheetData {
  assets: Array<{ name: string; value: number }>;
  liabilities: Array<{ name: string; value: number }>;
  equity: Array<{ name: string; value: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface DateRange {
  from: string;
  to: string;
}

interface BalanceSheetPDFProps {
  data: BalanceSheetData;
  dateRange: DateRange;
  language: string;
}

export const BalanceSheetPDF: React.FC<BalanceSheetPDFProps> = ({ data, dateRange, language }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src="/malti-logo.png" />
        <Text style={styles.title}>
          {language === 'ar' ? 'الميزانية العمومية' : 'Balance Sheet'}
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

      {/* Assets Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'الأصول' : 'Assets'}
        </Text>
        {data.assets?.filter(asset => asset).map((asset, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{asset.name || 'Unknown'}</Text>
            <Text style={styles.value}>
              {language === 'ar'
                ? `${(asset.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(asset.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'مجموع الأصول' : 'Total Assets'}
          </Text>
          <Text style={[styles.value, { color: '#2563eb' }]}>
            {language === 'ar'
              ? `${data.totalAssets.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalAssets.toLocaleString()}`
            }
          </Text>
        </View>
      </View>

      {/* Liabilities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'الالتزامات' : 'Liabilities'}
        </Text>
        {data.liabilities?.filter(liability => liability).map((liability, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{liability.name || 'Unknown'}</Text>
            <Text style={[styles.value, { color: '#ef4444' }]}>
              {language === 'ar'
                ? `${(liability.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(liability.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'مجموع الالتزامات' : 'Total Liabilities'}
          </Text>
          <Text style={[styles.value, { color: '#ef4444' }]}>
            {language === 'ar'
              ? `${data.totalLiabilities.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalLiabilities.toLocaleString()}`
            }
          </Text>
        </View>
      </View>

      {/* Equity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'حقوق الملكية' : 'Equity'}
        </Text>
        {data.equity?.filter(eq => eq).map((eq, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{eq.name || 'Unknown'}</Text>
            <Text style={[styles.value, { color: '#10b981' }]}>
              {language === 'ar'
                ? `${(eq.value || 0).toLocaleString('ar-QA')} ر.ق`
                : `QR ${(eq.value || 0).toLocaleString()}`
              }
            </Text>
          </View>
        ))}
        <View style={[styles.row, { borderTop: '2px solid #333', borderBottom: 'none' }]}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>
            {language === 'ar' ? 'مجموع حقوق الملكية' : 'Total Equity'}
          </Text>
          <Text style={[styles.value, { color: '#10b981' }]}>
            {language === 'ar'
              ? `${data.totalEquity.toLocaleString('ar-QA')} ر.ق`
              : `QR ${data.totalEquity.toLocaleString()}`
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
