'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useBulkCreateAssets, useProjects, useCategories, useCreateCategory } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button } from '@/app/components';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import * as mammoth from 'mammoth';

export default function ImportDocxPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();
  
  const { data: projectsData } = useProjects(1, 100);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const { data: categoriesData } = useCategories(selectedProjectId);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const createCategory = useCreateCategory();

  const [parsedAssets, setParsedAssets] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');

  const bulkCreateAssets = useBulkCreateAssets();

  useEffect(() => {
    if (projectsData?.data && projectsData.data.length === 1 && user?.siteId) {
      setSelectedProjectId(projectsData.data[0]._id);
    }
  }, [projectsData, user]);

  const convertArabicNumerals = (str: string) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedProjectId) return;
    try {
      const result = await createCategory.mutateAsync({ name: newCategoryName, projectId: selectedProjectId });
      setNewCategoryName('');
      setIsAddingCategory(false);
      if (result?.category?._id) {
        setSelectedCategoryId(result.category._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء الفئة');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('يرجى اختيار ملف بصيغة .docx فقط');
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const rows = doc.querySelectorAll('tr');
      if (rows.length === 0) {
        throw new Error('لم يتم العثور على جداول في الملف');
      }

      const extractedItems: any[] = [];
      let totalQuantity = 0;

      // Find column indices dynamically
      let mIdx = -1;
      let nameIdx = -1;
      let qtyIdx = -1;
      let notesIdx = -1;

      if (rows.length > 0) {
        const headerCells = rows[0].querySelectorAll('th, td');
        headerCells.forEach((cell, idx) => {
          const text = cell.textContent?.trim() || '';
          if (text === 'م' || text.includes('مسلسل')) mIdx = idx;
          if (text.includes('الصنف') || text.includes('الاسم')) nameIdx = idx;
          if (text.includes('الرصيد') || text.includes('الكمية') || text.includes('العدد')) qtyIdx = idx;
          if (text.includes('الملاحظات') || text.includes('ملاحظة')) notesIdx = idx;
        });
      }

      rows.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;

        const cells = row.querySelectorAll('td, th');
        
        // If we couldn't find headers, fallback to RTL visual assumption
        // 0: الملاحظات, 1: الرصيد, 2: الوحدة, 3: الصنف, 4: م
        const actualMIdx = mIdx !== -1 ? mIdx : (cells.length > 4 ? cells.length - 1 : 4);
        const actualNameIdx = nameIdx !== -1 ? nameIdx : (cells.length > 3 ? cells.length - 2 : 1);
        const actualQtyIdx = qtyIdx !== -1 ? qtyIdx : (cells.length > 3 ? cells.length - 4 : 3);
        const actualNotesIdx = notesIdx !== -1 ? notesIdx : 0;

        if (cells.length >= 2) {
          const itemName = cells[actualNameIdx]?.textContent?.trim() || '';
          let quantityStr = cells[actualQtyIdx]?.textContent?.trim() || '1';
          const notes = actualNotesIdx >= 0 && actualNotesIdx < cells.length ? cells[actualNotesIdx]?.textContent?.trim() : '';
          const originalM = cells[actualMIdx]?.textContent?.trim() || String(index);

          // Skip if empty or if it's a repeated header row from Word page breaks or totals
          if (!itemName || 
              ['الصنف', 'الاسم', 'الإسم', 'البيان', 'الإجمالي', 'الاجمالي'].includes(itemName) ||
              itemName.includes('الإجمالي')) return;

          // Handle Arabic numbers and parsing
          quantityStr = convertArabicNumerals(quantityStr);
          let quantity = parseInt(quantityStr, 10);
          if (isNaN(quantity) || quantity <= 0) quantity = 1;

          let condition = 'good';
          if (notes?.includes('متهالك') || notes?.includes('تالف') || notes?.includes('عطلانة')) {
            condition = 'needs_repair';
          }

          // Push a single row for the preview
          extractedItems.push({
            index: convertArabicNumerals(originalM),
            name: itemName,
            unit: cells.length > 2 ? cells[actualNameIdx - 1]?.textContent?.trim() || 'عدد' : 'عدد', // Fallback
            quantity: quantity,
            notes: notes,
            condition: condition
          });
        }
      });

      if (extractedItems.length === 0) {
        setError('لم يتم استخراج أي بيانات. تأكد من أن الجدول يحتوي على (الصنف) و (الرصيد)');
      } else {
        setParsedAssets(extractedItems);
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء قراءة الملف: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const removeRow = (indexToRemove: number) => {
    setParsedAssets(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProjectId || !selectedCategoryId) {
      setError('يرجى اختيار المشروع والفئة الافتراضية أولاً');
      return;
    }

    if (parsedAssets.length === 0) {
      setError('لا توجد أصول للاستيراد');
      return;
    }

    // Send assets directly with their bulk quantity instead of multiplying
    const payload = parsedAssets.map(assetGroup => ({
      name: assetGroup.name,
      quantity: assetGroup.quantity,
      condition: assetGroup.condition,
      specifications: {
        'ملاحظات': assetGroup.notes || '',
        'الوحدة': assetGroup.unit || 'عدد'
      },
      projectId: selectedProjectId,
      categoryId: selectedCategoryId,
    }));

    try {
      await bulkCreateAssets.mutateAsync(payload);
      router.push('/assets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في استيراد الأصول');
    }
  };

  if (authLoading) return <div className="p-8 text-center text-slate-500 font-medium">جاري التحميل...</div>;

  const projects = projectsData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right" dir="rtl">
        <Link href="/assets" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8 group font-medium">
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          العودة إلى الأصول
        </Link>

        <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-white/90 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <CardHeader className="pt-8 pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">استيراد أصول من ملف Word (.docx)</CardTitle>
          </CardHeader>
          
          <CardBody className="px-8 pb-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">المشروع <span className="text-red-500">*</span></label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    disabled={projects.length === 1 && !!user?.siteId}
                  >
                    <option value="">اختر مشروعاً</option>
                    {projects.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">الفئة الافتراضية <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      disabled={!selectedProjectId}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      {isAddingCategory ? 'إلغاء' : '+ إضافة فئة جديدة'}
                    </button>
                  </div>
                  
                  {isAddingCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="اسم الفئة الجديدة (مثال: أجهزة تكييف)"
                        className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={createCategory.isPending || !newCategoryName.trim()}
                        variant="primary"
                        className="px-6 py-3 whitespace-nowrap"
                      >
                        {createCategory.isPending ? 'جاري الإضافة...' : 'حفظ الفئة'}
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      required={!isAddingCategory}
                      disabled={!selectedProjectId}
                      className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                    >
                      <option value="">اختر فئة رئيسية للملف</option>
                      {Array.from(new Map(categories.map((c: any) => [c.name, c])).values()).map((c: any) => (
                        <option key={c._id} value={c._id}>{c.path}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors group">
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      {isParsing ? 'جاري قراءة الملف...' : 'اضغط أو اسحب ملف DOCX هنا'}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      يجب أن يحتوي الملف على جدول به (م، الصنف، الوحدة، الرصيد، الملاحظات)
                    </p>
                  </div>
                </div>
              </div>

              {parsedAssets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">معاينة الأصول المستخرجة</h3>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      سيتم إنشاء {parsedAssets.length} أصل
                    </span>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-center w-12">م</th>
                          <th className="px-4 py-3 font-semibold">الصنف</th>
                          <th className="px-4 py-3 font-semibold text-center">الوحدة</th>
                          <th className="px-4 py-3 font-semibold text-center">الرصيد</th>
                          <th className="px-4 py-3 font-semibold">الملاحظات</th>
                          <th className="px-4 py-3 font-semibold text-center w-12">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {parsedAssets.slice(0, 100).map((asset, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors group/row">
                            <td className="px-4 py-3 font-medium text-slate-500 text-center bg-slate-50/50">{i + 1}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{asset.name}</td>
                            <td className="px-4 py-3 text-slate-600 text-center">{asset.unit}</td>
                            <td className="px-4 py-3 font-bold text-blue-700 text-center bg-blue-50/30">{asset.quantity}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {asset.notes ? (
                                <span className={asset.condition === 'needs_repair' ? 'text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded' : ''}>
                                  {asset.notes}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                title="إزالة هذا الصف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedAssets.length > 100 && (
                      <div className="p-3 text-center text-sm text-slate-500 bg-slate-50 border-t border-slate-200">
                        عرض أول 100 أصل فقط من إجمالي {parsedAssets.length}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <Button 
                  variant="success" 
                  type="submit" 
                  disabled={bulkCreateAssets.isPending || parsedAssets.length === 0 || !selectedCategoryId}
                  className="px-8 py-3 font-bold shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {bulkCreateAssets.isPending ? 'جاري الاستيراد...' : <><CheckCircle2 className="w-5 h-5" /> بدء الاستيراد</>}
                </Button>
                <Button 
                  type="button"
                  variant="secondary" 
                  onClick={() => setParsedAssets([])}
                  className="px-8 py-3 font-semibold"
                >
                  مسح البيانات
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
