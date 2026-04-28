import { pdf } from '@react-pdf/renderer';
import { BalanceSheetPDF } from '@/components/pdf/BalanceSheetPDF';
import { TrialBalancePDF } from '@/components/pdf/TrialBalancePDF';
import { IncomeStatementPDF } from '@/components/pdf/IncomeStatementPDF';
import { CashFlowPDF } from '@/components/pdf/CashFlowPDF';

interface DateRange {
  from: string;
  to: string;
}

interface BalanceSheetData {
  assets: Array<{ name: string; value: number }>;
  liabilities: Array<{ name: string; value: number }>;
  equity: Array<{ name: string; value: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface TrialBalanceData {
  accounts: Array<{
    number: string;
    name: string;
    debit: number;
    credit: number;
  }>;
  totalDebit: number;
  totalCredit: number;
}

interface IncomeStatementData {
  revenue: Array<{ name: string; value: number }>;
  expenses: Array<{ name: string; value: number }>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface CashFlowData {
  operating: Array<{ name: string; value: number }>;
  investing: Array<{ name: string; value: number }>;
  financing: Array<{ name: string; value: number }>;
  totalOperating: number;
  totalInvesting: number;
  totalFinancing: number;
  netCashFlow: number;
}

/**
 * Generate and download Balance Sheet PDF with Arabic support
 */
export async function downloadBalanceSheetPDF(
  data: BalanceSheetData,
  dateRange: DateRange,
  language: string
) {
  try {
    const blob = await pdf(
      <BalanceSheetPDF data={data} dateRange={dateRange} language={language} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      language === 'ar'
        ? `الميزانية-العمومية-${dateRange.from}-${dateRange.to}.pdf`
        : `balance-sheet-${dateRange.from}-${dateRange.to}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating Balance Sheet PDF:', error);
    throw error;
  }
}

/**
 * Generate and download Trial Balance PDF with Arabic support
 */
export async function downloadTrialBalancePDF(
  data: TrialBalanceData,
  dateRange: DateRange,
  language: string
) {
  try {
    const blob = await pdf(
      <TrialBalancePDF data={data} dateRange={dateRange} language={language} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      language === 'ar'
        ? `ميزان-المراجعة-${dateRange.from}-${dateRange.to}.pdf`
        : `trial-balance-${dateRange.from}-${dateRange.to}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating Trial Balance PDF:', error);
    throw error;
  }
}

/**
 * Generate and download Income Statement PDF with Arabic support
 */
export async function downloadIncomeStatementPDF(
  data: IncomeStatementData,
  dateRange: DateRange,
  language: string
) {
  try {
    const blob = await pdf(
      <IncomeStatementPDF data={data} dateRange={dateRange} language={language} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      language === 'ar'
        ? `قائمة-الدخل-${dateRange.from}-${dateRange.to}.pdf`
        : `income-statement-${dateRange.from}-${dateRange.to}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating Income Statement PDF:', error);
    throw error;
  }
}

/**
 * Generate and download Cash Flow Statement PDF with Arabic support
 */
export async function downloadCashFlowPDF(
  data: CashFlowData,
  dateRange: DateRange,
  language: string
) {
  try {
    const blob = await pdf(
      <CashFlowPDF data={data} dateRange={dateRange} language={language} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      language === 'ar'
        ? `قائمة-التدفقات-النقدية-${dateRange.from}-${dateRange.to}.pdf`
        : `cash-flow-statement-${dateRange.from}-${dateRange.to}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating Cash Flow PDF:', error);
    throw error;
  }
}

/**
 * Helper function to format data from API response for Balance Sheet PDF
 */
export function formatBalanceSheetData(apiData: any): BalanceSheetData {
  // Check if the data has array format or just totals
  const hasArrays = Array.isArray(apiData.assets);

  if (hasArrays) {
    // Data contains arrays of items
    const assets = apiData.assets || [];
    const liabilities = apiData.liabilities || [];
    const equity = apiData.equity || [];

    return {
      assets: assets.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      liabilities: liabilities.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      equity: equity.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      totalAssets: assets.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
      totalLiabilities: liabilities.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
      totalEquity: equity.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
    };
  } else {
    // Data contains only totals (simple numbers)
    const assetsTotal = parseFloat(apiData.assets) || 0;
    const liabilitiesTotal = parseFloat(apiData.liabilities) || 0;
    const equityTotal = parseFloat(apiData.equity) || 0;

    return {
      assets: [
        { name: 'Total Assets', value: assetsTotal }
      ],
      liabilities: [
        { name: 'Total Liabilities', value: liabilitiesTotal }
      ],
      equity: [
        { name: 'Total Equity', value: equityTotal }
      ],
      totalAssets: assetsTotal,
      totalLiabilities: liabilitiesTotal,
      totalEquity: equityTotal,
    };
  }
}

/**
 * Helper function to format data from API response for Trial Balance PDF
 */
export function formatTrialBalanceData(apiData: any): TrialBalanceData {
  const accounts = apiData.accounts || [];

  return {
    accounts: accounts.map((account: any) => ({
      number: account.accountNumber || account.code || '',
      name: account.accountName || account.name || 'Unknown',
      debit: parseFloat(account.debit) || 0,
      credit: parseFloat(account.credit) || 0,
    })),
    totalDebit: accounts.reduce((sum: number, acc: any) => sum + (parseFloat(acc.debit) || 0), 0),
    totalCredit: accounts.reduce((sum: number, acc: any) => sum + (parseFloat(acc.credit) || 0), 0),
  };
}

/**
 * Helper function to format data from API response for Income Statement PDF
 */
export function formatIncomeStatementData(apiData: any): IncomeStatementData {
  const hasArrays = Array.isArray(apiData.revenue);

  if (hasArrays) {
    const revenue = apiData.revenue || [];
    const expenses = apiData.expenses || [];

    return {
      revenue: revenue.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      expenses: expenses.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      totalRevenue: revenue.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
      totalExpenses: expenses.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
      netIncome: revenue.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0) - expenses.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
    };
  } else {
    const revenueTotal = parseFloat(apiData.revenue) || 0;
    const expensesTotal = parseFloat(apiData.expenses) || 0;
    const netProfit = parseFloat(apiData.netProfit) || (revenueTotal - expensesTotal);

    return {
      revenue: [
        { name: 'Total Revenue', value: revenueTotal }
      ],
      expenses: [
        { name: 'Total Expenses', value: expensesTotal }
      ],
      totalRevenue: revenueTotal,
      totalExpenses: expensesTotal,
      netIncome: netProfit,
    };
  }
}

/**
 * Helper function to format data from API response for Cash Flow PDF
 */
export function formatCashFlowData(apiData: any): CashFlowData {
  const hasArrays = Array.isArray(apiData.operating);

  if (hasArrays) {
    const operating = apiData.operating || [];
    const investing = apiData.investing || [];
    const financing = apiData.financing || [];

    return {
      operating: operating.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      investing: investing.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      financing: financing.map((item: any) => ({
        name: item.name || item.accountName || 'Unknown',
        value: parseFloat(item.balance) || parseFloat(item.value) || 0,
      })),
      totalOperating: operating.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
      totalInvesting: investing.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
      totalFinancing: financing.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
      netCashFlow: operating.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0) + investing.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0) + financing.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || parseFloat(item.value) || 0), 0),
    };
  } else {
    const operatingTotal = parseFloat(apiData.operating) || 0;
    const investingTotal = parseFloat(apiData.investing) || 0;
    const financingTotal = parseFloat(apiData.financing) || 0;
    const netCashFlow = parseFloat(apiData.netCashFlow) || (operatingTotal + investingTotal + financingTotal);

    return {
      operating: [
        { name: 'Operating Activities', value: operatingTotal }
      ],
      investing: [
        { name: 'Investing Activities', value: investingTotal }
      ],
      financing: [
        { name: 'Financing Activities', value: financingTotal }
      ],
      totalOperating: operatingTotal,
      totalInvesting: investingTotal,
      totalFinancing: financingTotal,
      netCashFlow: netCashFlow,
    };
  }
}
