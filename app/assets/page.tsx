'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useAssets, useDeleteAsset, useCategories, useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Table, TableHead, TableBody, TableRow, TableCell, Loading, Error } from '@/app/components';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Eye, Trash2, Plus, FileSpreadsheet, Printer, ArrowDownToLine, ArrowUpFromLine, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';

function AssetsContent() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: projectsData } = useProjects(1, 100);
  const { data: assetsData, isLoading, error } = useAssets(
    selectedProjectId || undefined, 
    selectedCategoryId || undefined, 
    search || undefined, 
    selectedCondition || undefined,
    selectedAssignment || undefined,
    undefined, // custodianId
    undefined, // ids
    page, 
    20
  );
  const { data: categoriesData } = useCategories(selectedProjectId || undefined);
  const deleteAsset = useDeleteAsset();

  if (authLoading || isLoading) return <Loading />;
  if (error) return <Error message="Failed to load assets" />;

  const assets = assetsData?.data || [];
  const pagination = assetsData?.pagination || {};
  const categories = categoriesData?.data || [];
  const projects = projectsData?.data || [];

  const exportToExcel = () => {
    if (!assets || assets.length === 0) return;
    const data = assets.map((a: any) => ({
      'معرف النظام (System ID)': a.systemId,
      'اسم الأصل': a.name,
      'المشروع': a.projectId?.name || 'غير محدد',
      'الفئة': a.categoryId?.name || 'غير محدد',
      'الرقم التسلسلي': a.serialNumber || '-',
      'الحالة': a.condition === 'excellent' ? 'ممتاز' : a.condition === 'good' ? 'جيد' : a.condition === 'needs_repair' ? 'يحتاج صيانة' : 'تالف / خردة',
      'تاريخ الشراء': a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('ar-EG') : '-',
      'تكلفة الشراء': a.purchaseCost || '-',
      'المورد': a.vendor || '-',
      'العهدة الحالية (المسؤول)': a.currentCustodianId?.fullName || a.custodianName || 'في المخزن',
      'الرصيد': a.quantity || 1,
      'الملاحظات': a.notes || a.specifications?.['ملاحظات'] || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns (rough estimate)
    const colWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, 15) }));
    ws['!cols'] = colWidths;
    
    // Set RTL direction for the worksheet
    if(!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ rightToLeft: true });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "تقرير_الأصول.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="print:hidden">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">سجل الأصول</h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              إجمالي السجلات المدخلة: 
              <span className="text-blue-700 font-bold bg-blue-100/50 px-3 py-0.5 rounded-lg border border-blue-200 shadow-sm">
                {pagination.total || 0}
              </span>
              سجل
            </p>
          </div>
            <div className="flex flex-wrap gap-3 print:hidden">
            {selectedIds.length > 0 && (
              <Button 
                variant="secondary" 
                className="flex items-center gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold shadow-sm"
                onClick={() => {
                  sessionStorage.setItem('printAssetIds', JSON.stringify(selectedIds));
                  router.push('/assets/print');
                }}
              >
                <Printer className="w-4 h-4" />
                طباعة {selectedIds.length} ملصق
              </Button>
            )}
              <Button 
                variant="secondary" 
                onClick={() => window.print()} 
                className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                طباعة السجل
              </Button>
              {user?.role === 'admin' && (
                <Button 
                  variant="secondary" 
                  onClick={exportToExcel}
                  className="flex items-center gap-2 border border-green-300 bg-white text-green-700 hover:bg-green-50 shadow-sm transition-all"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  تصدير إلى Excel
                </Button>
              )}
              <Link href="/assets/import">
                <Button variant="secondary" className="flex items-center gap-2 border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-all">
                  <FileSpreadsheet className="w-4 h-4" />
                  استيراد من ملف Excel
                </Button>
              </Link>
              <Link href="/assets/new">
                <Button variant="success" className="flex items-center gap-2 shadow-sm shadow-green-500/20 hover:shadow-green-500/40 transition-all">
                  <Plus className="w-5 h-5" />
                  إضافة أصل جديد
                </Button>
              </Link>
            </div>
        </div>

        <Card className="print:shadow-none print:border-none print:bg-transparent">
          <CardHeader className="print:hidden">
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="البحث بالاسم أو معرف النظام..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-500 font-medium"
              />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                disabled={projects.length === 1 && !!user?.siteId}
              >
                <option value="">جميع المشاريع</option>
                {projects.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                <option value="">جميع الفئات</option>
                {Array.from(new Map(categories.map((c: any) => [c.name, c])).values()).map((category: any) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                <option value="">جميع الحالات</option>
                <option value="excellent">ممتاز</option>
                <option value="good">جيد</option>
                <option value="bad">سيء</option>
                <option value="needs_repair">يحتاج صيانة</option>
                <option value="scrapped">تالف / خردة</option>
              </select>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                <option value="">التخصيص (الكل)</option>
                <option value="stock">في المخزن (متاح)</option>
                <option value="custody">في عهدة (مسلّم)</option>
              </select>
              <Button variant="primary">بحث</Button>
            </div>
          </CardHeader>
          <CardBody>
            {assets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header className="w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={assets.length > 0 && selectedIds.length === assets.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(assets.map((a: any) => a._id));
                            else setSelectedIds([]);
                          }}
                        />
                      </TableCell>
                      <TableCell header>معرف النظام</TableCell>
                      <TableCell header>الاسم</TableCell>
                      <TableCell header>الرصيد</TableCell>
                      <TableCell header>الحالة</TableCell>
                      <TableCell header>الملاحظات</TableCell>
                      <TableCell header className="print:hidden">الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.map((asset: any) => (
                      <TableRow key={asset._id} className="print:border-b print:border-slate-300">
                        <TableCell className="text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedIds.includes(asset._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(prev => [...prev, asset._id]);
                              else setSelectedIds(prev => prev.filter(id => id !== asset._id));
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-900">{asset.systemId}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{asset.name}</TableCell>
                        <TableCell>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {asset.quantity || 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded text-sm font-bold ${
                              asset.condition === 'good'
                                ? 'bg-green-100 text-green-800'
                                : asset.condition === 'excellent'
                                ? 'bg-blue-100 text-blue-800'
                                : asset.condition === 'bad'
                                ? 'bg-yellow-100 text-yellow-800'
                                : asset.condition === 'needs_repair'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {asset.condition === 'good' ? 'جيد' : asset.condition === 'excellent' ? 'ممتاز' : asset.condition === 'bad' ? 'سيء' : asset.condition === 'needs_repair' ? 'يحتاج صيانة' : 'تالف / خردة'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-600">
                          {asset.notes || '-'}
                        </TableCell>
                        <TableCell className="print:hidden">
                          <div className="flex gap-2">
                            <Link href={`/assets/${asset._id}`}>
                              <Button variant="secondary" className="flex items-center gap-1 font-semibold">
                                <Eye className="w-4 h-4" />
                                عرض
                              </Button>
                            </Link>
                            <Link href={`/assets/${asset._id}/edit`}>
                              <Button variant="secondary" className="flex items-center gap-1 font-semibold text-blue-700 hover:bg-blue-50 border-blue-200">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="danger"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
                                  deleteAsset.mutate(asset._id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="mt-6 flex justify-between items-center print:hidden">
                  <span className="text-slate-700 font-medium">
                    عرض {(page - 1) * 20 + 1} إلى {Math.min(page * 20, pagination.total)} من {pagination.total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      variant="secondary"
                    >
                      السابق
                    </Button>
                    <span className="px-4 py-2 font-medium text-slate-800">صفحة {page}</span>
                    <Button
                      disabled={page >= pagination.pages}
                      onClick={() => setPage(page + 1)}
                      variant="secondary"
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 font-medium">لم يتم العثور على أصول</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AssetsContent />
    </Suspense>
  );
}
