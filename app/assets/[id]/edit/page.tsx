'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useEmployees } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Loading } from '@/app/components';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Save, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/app/lib/api';

export default function EditAsset() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    condition: 'good',
    purchaseDate: '',
    purchaseCost: '',
    vendor: '',
    notes: '',
    custodianName: '',
  });

  const { data: assetData, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const res = await api.get(`/assets/${assetId}`);
      return res.data;
    },
    enabled: !!assetId,
  });

  useEffect(() => {
    if (assetData?.asset) {
      const a = assetData.asset;
      setFormData({
        name: a.name || '',
        serialNumber: a.serialNumber || '',
        condition: a.condition || 'good',
        purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString().split('T')[0] : '',
        purchaseCost: a.purchaseCost || '',
        vendor: a.vendor || '',
        notes: a.notes || a.specifications?.['ملاحظات'] || '',
        custodianName: a.custodianName || '',
      });
    }
  }, [assetData]);

  const { data: employeesData } = useEmployees(assetData?.asset?.projectId?._id);
  const employees = employeesData?.data || [];

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/assets/${assetId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      router.push('/assets');
    },
  });

  if (authLoading || assetLoading) return <Loading />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...formData };
    if (!payload.purchaseDate) payload.purchaseDate = null;
    if (!payload.purchaseCost) payload.purchaseCost = null;
    updateMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/assets">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة للسجل
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">تعديل بيانات الأصل</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تعديل: {assetData?.asset?.name}</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">اسم الأصل *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الرقم التسلسلي</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الحالة</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">ممتاز</option>
                    <option value="good">جيد</option>
                    <option value="needs_repair">يحتاج صيانة</option>
                    <option value="scrapped">تالف / خردة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الشراء</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">تكلفة الشراء</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">المورد</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">العهدة الحالية (المسؤول أو المكتب)</label>
                  <select
                    value={formData.custodianName}
                    onChange={(e) => setFormData({ ...formData, custodianName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">في المخزن (بدون عهدة)</option>
                    {employees.map((emp: any) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name} {emp.isOffice ? '(مكتب/جهة)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الملاحظات</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100">
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
