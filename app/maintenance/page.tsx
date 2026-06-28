'use client';

import { useRequireRole } from '@/app/hooks/useProtected';
import { useMaintenanceTasks, useUpdateMaintenanceStatus } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Loading } from '@/app/components';
import { CheckCircle, AlertTriangle, Clock, Hammer, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MaintenancePage() {
  const { user, isLoading: authLoading } = useRequireRole(['admin', 'site_manager']);
  
  const [filter, setFilter] = useState('');
  const { data: tasksData, isLoading: tasksLoading } = useMaintenanceTasks(undefined, filter);
  const updateStatus = useUpdateMaintenanceStatus();

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      let data: any = { status: newStatus };
      if (newStatus === 'completed') {
        const costStr = prompt('الرجاء إدخال تكلفة الصيانة (بالجنيه) أو اتركها فارغة إذا لم تكن هناك تكلفة:');
        if (costStr === null) return; // User cancelled
        const cost = parseFloat(costStr);
        if (!isNaN(cost) && cost >= 0) {
          data.cost = cost;
        }
      }
      await updateStatus.mutateAsync({ id, data });
    } catch (error) {
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  if (authLoading || tasksLoading) return <Loading />;

  const tasks = tasksData?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> معلق</span>;
      case 'in_progress':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Hammer className="w-3 h-3"/> جاري العمل</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> مكتمل</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            طلبات الصيانة
          </h1>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border-gray-300 rounded-lg text-right focus:ring-blue-500 focus:border-blue-500 py-2 px-4 shadow-sm"
          >
            <option value="">الكل</option>
            <option value="pending">المعلقة</option>
            <option value="in_progress">جاري العمل</option>
            <option value="completed">المكتملة</option>
          </select>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">لا توجد طلبات صيانة</h3>
            <p className="text-gray-500 mt-2">الأمور كلها على ما يرام!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task: any) => (
              <Card key={task._id} className="hover:shadow-lg transition-shadow border border-gray-100">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/assets/${task.assetId?._id}`} className="text-blue-600 font-bold hover:underline text-lg">
                        {task.assetId?.name || 'أصل غير معروف'}
                      </Link>
                      <p className="text-sm font-mono text-gray-500 mt-1">{task.assetId?.systemId}</p>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">تفاصيل المشكلة / البلاغ:</p>
                    <p className="text-gray-900 bg-orange-50 p-3 rounded-lg border border-orange-100 font-medium text-sm">
                      {task.description || 'لا يوجد تفاصيل'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>تاريخ البلاغ: {new Date(task.scheduledDate).toLocaleDateString('ar-EG')}</span>
                  </div>

                  {task.status !== 'completed' && (
                    <div className="pt-4 border-t border-gray-100 flex gap-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(task._id, 'in_progress')}
                          className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Hammer className="w-4 h-4" /> بدء الصيانة
                        </button>
                      )}
                      {(task.status === 'pending' || task.status === 'in_progress') && (
                        <button
                          onClick={() => handleUpdateStatus(task._id, 'completed')}
                          className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> تمت الصيانة
                        </button>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
