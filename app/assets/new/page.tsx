'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useBulkCreateAssets, useProjects, useCategories, useEmployees, useCreateCategory } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button } from '@/app/components';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, CheckCircle2, RefreshCw, X } from 'lucide-react';

export default function NewAssetPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();
  
  const { data: projectsData } = useProjects(1, 100);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const { data: categoriesData } = useCategories(selectedProjectId);
  const { data: employeesData } = useEmployees(selectedProjectId);

  const generateSN = () => `SN-${Math.floor(100000 + Math.random() * 900000)}`;

  // Dynamic array of assets to be created
  const [assetsList, setAssetsList] = useState([
    { categoryId: '', name: '', serialNumber: generateSN(), condition: 'good', custodianName: '', purchaseDate: '', purchaseCost: '', vendor: '' }
  ]);

  const bulkCreateAssets = useBulkCreateAssets();
  const createCategory = useCreateCategory();
  const [error, setError] = useState('');

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [targetRowIndex, setTargetRowIndex] = useState<number | null>(null);

  // Auto-select project if user is restricted to one siteId
  useEffect(() => {
    if (projectsData?.data && projectsData.data.length === 1 && user?.siteId) {
      const singleProjectId = projectsData.data[0]._id;
      setSelectedProjectId(singleProjectId);
    }
  }, [projectsData, user]);

  const handleAssetChange = (index: number, field: string, value: string) => {
    const newList = [...assetsList];
    newList[index] = { ...newList[index], [field]: value };
    setAssetsList(newList);
  };

  const addAssetRow = () => {
    setAssetsList([
      ...assetsList,
      { categoryId: '', name: '', serialNumber: generateSN(), condition: 'good', custodianName: '', purchaseDate: '', purchaseCost: '', vendor: '' }
    ]);
  };

  const removeAssetRow = (index: number) => {
    if (assetsList.length === 1) return; // Always keep at least one row
    const newList = assetsList.filter((_, i) => i !== index);
    setAssetsList(newList);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || !selectedProjectId) return;
    try {
      const res = await createCategory.mutateAsync({ name: newCategoryName, projectId: selectedProjectId });
      if (targetRowIndex !== null && res.category) {
        handleAssetChange(targetRowIndex, 'categoryId', res.category._id);
      }
      setShowCategoryModal(false);
      setNewCategoryName('');
      setTargetRowIndex(null);
    } catch (err) {
      alert('فشل إنشاء الفئة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProjectId) {
      setError('يرجى اختيار المشروع أولاً');
      return;
    }

    // Validate rows
    const validAssets = assetsList.filter(a => a.name.trim() !== '' && a.categoryId !== '');
    if (validAssets.length === 0) {
      setError('يرجى إدخال اسم وفئة أصل واحد على الأقل');
      return;
    }

    const payload = validAssets.map(asset => ({
      ...asset,
      projectId: selectedProjectId,
    }));

    try {
      await bulkCreateAssets.mutateAsync(payload);
      router.push('/assets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء الأصول');
    }
  };

  if (authLoading) return <div className="p-8 text-center text-slate-500 font-medium">جاري التحميل...</div>;

  const projects = projectsData?.data || [];
  const categories = categoriesData?.data || [];
  const employees = employeesData?.data || [];

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
            <CardTitle className="text-2xl font-bold text-slate-900">إنشاء أصول جديدة</CardTitle>
          </CardHeader>
          
          <CardBody className="px-8 pb-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
                <div className="w-2 h-full bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Global Settings: Project Only */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-md">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    المشروع (سيتم ربط جميع الأصول به) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-100 disabled:text-slate-900 disabled:bg-slate-100"
                    disabled={projects.length === 1 && !!user?.siteId}
                  >
                    <option value="" className="text-slate-900">اختر مشروعاً</option>
                    {projects.map((p: any) => (
                      <option key={p._id} value={p._id} className="text-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Assets List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-800">بيانات الأصول</h3>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    العدد: {assetsList.length}
                  </span>
                </div>

                {assetsList.map((asset, index) => (
                  <div key={index} className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                    {/* Remove button for multiple rows */}
                    {assetsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAssetRow(index)}
                        className="absolute top-4 left-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="حذف هذا الأصل"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Category */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          الفئة <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={asset.categoryId}
                            onChange={(e) => handleAssetChange(index, 'categoryId', e.target.value)}
                            required
                            disabled={!selectedProjectId}
                            className="flex-1 w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-100 disabled:text-slate-900 disabled:bg-slate-100"
                          >
                            <option value="" className="text-slate-900">اختر فئة</option>
                            {categories.map((c: any) => (
                              <option key={c._id} value={c._id} className="text-slate-900">{c.path}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedProjectId) {
                                setError('يرجى اختيار المشروع أولاً قبل إضافة فئة');
                                return;
                              }
                              setTargetRowIndex(index);
                              setShowCategoryModal(true);
                            }}
                            disabled={!selectedProjectId}
                            className={`px-3 py-2.5 border font-bold rounded-xl transition-all shadow-sm ${!selectedProjectId ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-blue-600'}`}
                            title={!selectedProjectId ? '⚠️ يرجى اختيار المشروع من الأعلى أولاً لكي تتمكن من إضافة فئة' : 'إضافة فئة جديدة'}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          {categories.find((c: any) => c._id === asset.categoryId)?.name === 'مركبات' ? 'اسم المركبة / الموديل' : 'اسم الأصل'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={asset.name}
                          onChange={(e) => handleAssetChange(index, 'name', e.target.value)}
                          required
                          placeholder={categories.find((c: any) => c._id === asset.categoryId)?.name === 'مركبات' ? 'مثال: تويوتا كورولا 2024' : 'مثال: لابتوب ديل'}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-bold placeholder:text-slate-400 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>

                      {/* Serial Number */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          {categories.find((c: any) => c._id === asset.categoryId)?.name === 'مركبات' ? 'رقم اللوحة / الشاسيه' : 'الرقم التسلسلي'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={asset.serialNumber}
                            onChange={(e) => handleAssetChange(index, 'serialNumber', e.target.value)}
                            placeholder={categories.find((c: any) => c._id === asset.categoryId)?.name === 'مركبات' ? 'مثال: أ ب ج - 1234' : 'مثال: SN-12345'}
                            className="w-full px-4 py-2.5 pl-12 bg-white border border-slate-300 text-slate-900 font-bold placeholder:text-slate-400 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleAssetChange(index, 'serialNumber', generateSN())}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="توليد رقم تسلسلي جديد"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Condition */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          الحالة
                        </label>
                        <select
                          value={asset.condition}
                          onChange={(e) => handleAssetChange(index, 'condition', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        >
                          <option value="excellent" className="text-slate-900">ممتاز</option>
                          <option value="good" className="text-slate-900">جيد</option>
                          <option value="needs_repair" className="text-slate-900">يحتاج إصلاح</option>
                          <option value="scrapped" className="text-slate-900">تالف</option>
                        </select>
                      </div>

                      {/* Custodian Name */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          المسئول عن العهده
                        </label>
                        <select
                          value={asset.custodianName}
                          onChange={(e) => handleAssetChange(index, 'custodianName', e.target.value)}
                          disabled={!selectedProjectId}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-100 disabled:text-slate-900 disabled:bg-slate-100"
                        >
                          <option value="" className="text-slate-900">اختر موظفاً (اختياري)</option>
                          {employees.map((emp: any) => (
                            <option key={emp._id} value={emp.name} className="text-slate-900">{emp.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Purchase Date */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          تاريخ الشراء (اختياري)
                        </label>
                        <input
                          type="date"
                          value={asset.purchaseDate}
                          onChange={(e) => handleAssetChange(index, 'purchaseDate', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>

                      {/* Vendor */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          المورد (اختياري)
                        </label>
                        <input
                          type="text"
                          value={asset.vendor || ''}
                          onChange={(e) => handleAssetChange(index, 'vendor', e.target.value)}
                          placeholder="اسم المورد"
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-bold placeholder:text-slate-400 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>

                      {/* Purchase Cost */}
                      <div className="space-y-2 lg:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700">
                          تكلفة الشراء (اختياري)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={asset.purchaseCost || ''}
                          onChange={(e) => handleAssetChange(index, 'purchaseCost', e.target.value)}
                          placeholder="مثال: 5000"
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-bold placeholder:text-slate-400 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAssetRow}
                  className="w-full py-4 mt-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-semibold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  إضافة أصل آخر لنفس المشروع
                </button>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <Button 
                  variant="success" 
                  type="submit" 
                  disabled={bulkCreateAssets.isPending}
                  className="px-8 py-3 font-bold shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
                >
                  {bulkCreateAssets.isPending ? (
                    'جاري الحفظ...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      إنشاء الأصول
                    </>
                  )}
                </Button>
                <Link href="/assets">
                  <Button variant="secondary" className="px-8 py-3 font-semibold">إلغاء</Button>
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-slate-900">إضافة فئة جديدة</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                  setTargetRowIndex(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory} className="p-6 text-right">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">اسم الفئة</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="مثال: أجهزة كمبيوتر"
                    className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 font-bold placeholder:text-slate-400 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? 'جاري الإضافة...' : 'حفظ الفئة'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                    setTargetRowIndex(null);
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
