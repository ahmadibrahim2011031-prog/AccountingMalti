// src/utils/autoTranslate.ts
// Automatic translation helper for common UI elements

interface TranslationMap {
  [key: string]: string
}

// Common English to Arabic translations for UI elements
const commonTranslations: TranslationMap = {
  // Actions
  'Add': 'إضافة',
  'Edit': 'تعديل',
  'Delete': 'حذف',
  'Save': 'حفظ',
  'Cancel': 'إلغاء',
  'Submit': 'إرسال',
  'Close': 'إغلاق',
  'View': 'عرض',
  'Search': 'البحث',
  'Filter': 'تصفية',
  'Sort': 'ترتيب',
  'Export': 'تصدير',
  'Import': 'استيراد',
  'Download': 'تحميل',
  'Upload': 'رفع',
  'Print': 'طباعة',
  'Copy': 'نسخ',
  'Refresh': 'تحديث',
  'Retry': 'إعادة المحاولة',
  'Reset': 'إعادة تعيين',
  'Clear': 'مسح',
  'Select': 'اختيار',
  'Confirm': 'تأكيد',
  'Approve': 'موافقة',
  'Reject': 'رفض',
  'Accept': 'قبول',
  'Decline': 'رفض',
  'Enable': 'تفعيل',
  'Disable': 'تعطيل',
  'Activate': 'تفعيل',
  'Deactivate': 'إلغاء التفعيل',
  'Show': 'إظهار',
  'Hide': 'إخفاء',
  'Expand': 'توسيع',
  'Collapse': 'طي',
  'Next': 'التالي',
  'Previous': 'السابق',
  'First': 'الأول',
  'Last': 'الأخير',
  'Back': 'رجوع',
  'Forward': 'إلى الأمام',
  'Continue': 'متابعة',
  'Finish': 'إنهاء',
  'Complete': 'إكمال',
  'Start': 'بدء',
  'Stop': 'إيقاف',
  'Pause': 'إيقاف مؤقت',
  'Resume': 'استئناف',
  'Update': 'تحديث',
  'Create': 'إنشاء',
  'New': 'جديد',
  'Open': 'فتح',
  'Browse': 'تصفح',
  'Choose': 'اختيار',
  'Pick': 'اختيار',

  // Status
  'Active': 'نشط',
  'Inactive': 'غير نشط',
  'Pending': 'في الانتظار',
  'Approved': 'موافق عليه',
  'Rejected': 'مرفوض',
  'Completed': 'مكتمل',
  'Cancelled': 'ملغي',
  'Draft': 'مسودة',
  'Published': 'منشور',
  'Archived': 'مؤرشف',
  'Deleted': 'محذوف',
  'Available': 'متاح',
  'Assigned': 'مكلف',
  'Working': 'يعمل',
  'Suspended': 'موقوف',
  'Expired': 'منتهي الصلاحية',
  'Valid': 'صالح',
  'Invalid': 'غير صالح',
  'Verified': 'تم التحقق',
  'Unverified': 'غير محقق',
  'Confirmed': 'مؤكد',
  'Unconfirmed': 'غير مؤكد',
  'Online': 'متصل',
  'Offline': 'غير متصل',
  'Connected': 'متصل',
  'Disconnected': 'منقطع',
  'Loading': 'جاري التحميل',
  'Loaded': 'تم التحميل',
  'Error': 'خطأ',
  'Success': 'نجح',
  'Warning': 'تحذير',
  'Info': 'معلومات',
  'Notice': 'إشعار',

  // Common Fields
  'Name': 'الاسم',
  'Email': 'البريد الإلكتروني',
  'Phone': 'الهاتف',
  'Address': 'العنوان',
  'Date': 'التاريخ',
  'Time': 'الوقت',
  'Status': 'الحالة',
  'Type': 'النوع',
  'Category': 'الفئة',
  'Description': 'الوصف',
  'Details': 'التفاصيل',
  'Notes': 'الملاحظات',
  'Comments': 'التعليقات',
  'Total': 'الإجمالي',
  'Amount': 'المبلغ',
  'Price': 'السعر',
  'Quantity': 'الكمية',
  'ID': 'المعرف',
  'Code': 'الرمز',
  'Number': 'الرقم',
  'Reference': 'المرجع',
  'Title': 'العنوان',
  'Subject': 'الموضوع',
  'Message': 'الرسالة',
  'Content': 'المحتوى',
  'File': 'ملف',
  'Files': 'ملفات',
  'Document': 'مستند',
  'Documents': 'مستندات',
  'Image': 'صورة',
  'Images': 'صور',
  'Photo': 'صورة',
  'Photos': 'صور',
  'Video': 'فيديو',
  'Videos': 'فيديوهات',
  'Link': 'رابط',
  'Links': 'روابط',
  'URL': 'رابط',
  'Website': 'موقع ويب',
  'Page': 'صفحة',
  'Pages': 'صفحات',
  'Section': 'قسم',
  'Sections': 'أقسام',
  'Item': 'عنصر',
  'Items': 'عناصر',
  'Record': 'سجل',
  'Records': 'سجلات',
  'Entry': 'إدخال',
  'Entries': 'إدخالات',
  'Row': 'صف',
  'Rows': 'صفوف',
  'Column': 'عمود',
  'Columns': 'أعمدة',
  'Table': 'جدول',
  'Tables': 'جداول',
  'List': 'قائمة',
  'Lists': 'قوائم',
  'Menu': 'قائمة',
  'Menus': 'قوائم',
  'Option': 'خيار',
  'Options': 'خيارات',
  'Setting': 'إعداد',
  'Settings': 'الإعدادات',
  'Configuration': 'التكوين',
  'Preference': 'تفضيل',
  'Preferences': 'التفضيلات',
  'Property': 'خاصية',
  'Properties': 'الخصائص',
  'Attribute': 'سمة',
  'Attributes': 'السمات',
  'Feature': 'ميزة',
  'Features': 'الميزات',
  'Function': 'وظيفة',
  'Functions': 'الوظائف',
  'Tool': 'أداة',
  'Tools': 'الأدوات',
  'Service': 'خدمة',
  'Services': 'الخدمات',
  'Product': 'منتج',
  'Products': 'المنتجات',
  'Order': 'طلب',
  'Orders': 'الطلبات',
  'Customer': 'عميل',
  'Customers': 'العملاء',
  'User': 'مستخدم',
  'Users': 'المستخدمين',
  'Account': 'حساب',
  'Accounts': 'الحسابات',
  'Profile': 'الملف الشخصي',
  'Profiles': 'الملفات الشخصية',
  'Role': 'دور',
  'Roles': 'الأدوار',
  'Permission': 'صلاحية',
  'Permissions': 'الصلاحيات',
  'Group': 'مجموعة',
  'Groups': 'المجموعات',
  'Team': 'فريق',
  'Teams': 'الفرق',
  'Department': 'قسم',
  'Departments': 'الأقسام',
  'Company': 'شركة',
  'Companies': 'الشركات',
  'Organization': 'منظمة',
  'Organizations': 'المنظمات',
  'Project': 'مشروع',
  'Projects': 'المشاريع',
  'Task': 'مهمة',
  'Tasks': 'المهام',
  'Activity': 'نشاط',
  'Activities': 'الأنشطة',
  'Event': 'حدث',
  'Events': 'الأحداث',
  'Report': 'تقرير',
  'Reports': 'التقارير',
  'Dashboard': 'لوحة التحكم',
  'Overview': 'نظرة عامة',
  'Summary': 'ملخص',
  'Statistics': 'الإحصائيات',
  'Analytics': 'التحليلات',
  'Chart': 'مخطط',
  'Charts': 'المخططات',
  'Graph': 'رسم بياني',
  'Graphs': 'الرسوم البيانية',

  // Time and Date
  'Today': 'اليوم',
  'Yesterday': 'أمس',
  'Tomorrow': 'غداً',
  'Week': 'أسبوع',
  'Month': 'شهر',
  'Year': 'سنة',
  'Hour': 'ساعة',
  'Minute': 'دقيقة',
  'Second': 'ثانية',
  'Morning': 'صباح',
  'Afternoon': 'بعد الظهر',
  'Evening': 'مساء',
  'Night': 'ليل',
  'Now': 'الآن',
  'Later': 'لاحقاً',
  'Soon': 'قريباً',
  'Recent': 'حديث',
  'Latest': 'الأحدث',
  'Current': 'الحالي',
  'Past': 'الماضي',
  'Future': 'المستقبل',

  // Common Phrases
  'Please wait': 'يرجى الانتظار',
  'Loading...': 'جاري التحميل...',
  'No data': 'لا توجد بيانات',
  'No results': 'لا توجد نتائج',
  'Not found': 'غير موجود',
  'Not available': 'غير متاح',
  'Coming soon': 'قريباً',
  'Under construction': 'تحت الإنشاء',
  'Maintenance mode': 'وضع الصيانة',
  'Try again': 'حاول مرة أخرى',
  'Something went wrong': 'حدث خطأ ما',
  'Operation successful': 'تمت العملية بنجاح',
  'Operation failed': 'فشلت العملية',
  'Are you sure?': 'هل أنت متأكد؟',
  'This action cannot be undone': 'لا يمكن التراجع عن هذا الإجراء',
  'Please confirm': 'يرجى التأكيد',
  'Required field': 'حقل مطلوب',
  'Optional field': 'حقل اختياري',
  'Invalid input': 'إدخال غير صحيح',
  'Valid input': 'إدخال صحيح',
  'Field is required': 'الحقل مطلوب',
  'Please enter': 'يرجى الإدخال',
  'Please select': 'يرجى الاختيار',
  'Choose an option': 'اختر خياراً',
  'Select all': 'اختيار الكل',
  'Deselect all': 'إلغاء اختيار الكل',
  'No items selected': 'لم يتم اختيار عناصر',
  'All items selected': 'تم اختيار جميع العناصر'
}

// Function to automatically translate common UI text
export function autoTranslate(text: string): string {
  // Remove extra spaces and normalize
  const normalizedText = text.trim()
  
  // Direct match
  if (commonTranslations[normalizedText]) {
    return commonTranslations[normalizedText]
  }
  
  // Case-insensitive match
  const lowerText = normalizedText.toLowerCase()
  const matchKey = Object.keys(commonTranslations).find(
    key => key.toLowerCase() === lowerText
  )
  
  if (matchKey) {
    return commonTranslations[matchKey]
  }
  
  // Return original text if no translation found
  return text
}

// Function to check if text needs translation
export function needsTranslation(text: string, currentLanguage: string): boolean {
  if (currentLanguage !== 'ar') return false
  
  // Skip if text is too short or looks like a variable
  if (text.length < 2 || /^[A-Z_]+$/.test(text)) return false
  
  // Check if it looks like English
  const englishPatterns = [
    /^[a-zA-Z\s\-_]+$/, // Only Latin characters, spaces, hyphens, underscores
    /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i, // Common English words
    /[A-Z][a-z]+/, // Capitalized words
  ]
  
  return englishPatterns.some(pattern => pattern.test(text))
}

// Function to suggest translation key based on text
export function suggestTranslationKey(text: string, context: string = ''): string {
  // Clean the text
  const cleanText = text
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace spaces with underscores
  
  // Add context prefix if provided
  if (context) {
    return `${context}.${cleanText}`
  }
  
  return cleanText
}

// Export the translation map for external use
export { commonTranslations }
