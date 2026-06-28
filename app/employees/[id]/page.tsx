'use client';

import { useEmployee, useAssets } from '@/app/hooks/useApi';
import { Card, CardBody, Loading, Button, Table, TableHead, TableBody, TableRow, TableCell } from '@/app/components';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, User, Briefcase, Calendar } from 'lucide-react';

export default function EmployeeCustodyReport() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const { data: employeeRes, isLoading: employeeLoading } = useEmployee(employeeId);
  const employee = employeeRes?.data;

  // Fetch up to 1000 assets for this custodian to ensure all show on report
  const { data: assetsData, isLoading: assetsLoading } = useAssets(
    undefined, undefined, undefined, undefined, undefined, employeeId, undefined, 1, 1000
  );
  const assets = assetsData?.data || [];

  if (employeeLoading || assetsLoading) return <Loading />;

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">الموظف غير موجود</h2>
          <Button onClick={() => router.back()} variant="primary">العودة</Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Non-printable header actions */}
      <div className="max-w-4xl mx-auto px-4 py-8 print:hidden flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة
        </button>
        
        <Button 
          variant="primary" 
          onClick={handlePrint}
          className="flex items-center gap-2 font-bold shadow-md shadow-blue-500/30"
        >
          <Printer className="w-5 h-5" />
          طباعة كشف العهدة
        </Button>
      </div>

      {/* Printable Report Area */}
      <div className="max-w-4xl mx-auto px-4 pb-12 print:p-0">
        <Card className="print:shadow-none print:border-none">
          <CardBody className="p-8 print:p-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-6 mb-8" dir="rtl">
              {/* Right Side - Title */}
              <div className="w-1/3 text-right">
                <h1 className="text-3xl font-black text-slate-900 mb-2">كشف عهدة موظف</h1>
                <p className="text-slate-500 font-medium text-sm">إقرار استلام عهد شخصية / مشاريع</p>
              </div>
              
              {/* Center - Logo */}
              <div className="w-1/3 flex justify-center items-center">
                <img 
                  src="/logo.png" 
                  alt="Company Logo" 
                  className="h-20 object-contain"
                />
              </div>

              {/* Left Side - Date */}
              <div className="w-1/3 text-left">
                <p className="text-slate-500 font-bold">{today}</p>
              </div>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 print:bg-slate-50/50 p-6 rounded-2xl mb-8 text-right" dir="rtl">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-bold">اسم الموظف</span>
                </div>
                <span className="text-lg font-black text-slate-900">{employee.name}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm font-bold">القسم / الوظيفة</span>
                </div>
                <span className="text-lg font-bold text-slate-800">{employee.department || 'غير متوفر'}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-bold">المشروع التابع له</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{employee.projectId?.name || 'غير متوفر'}</span>
              </div>
            </div>

            {/* Assets Table */}
            <div className="mb-12">
              <h3 className="text-xl font-bold text-slate-800 mb-4 text-right" dir="rtl">تفاصيل العهد المُسلمة:</h3>
              {assets.length > 0 ? (
                <div className="border rounded-xl overflow-hidden print:border-slate-300">
                  <table className="w-full text-right" dir="rtl">
                    <thead className="bg-slate-100 print:bg-slate-200 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-4 text-sm">م</th>
                        <th className="p-4 text-sm">الباركود (System ID)</th>
                        <th className="p-4 text-sm">اسم الأصل / العهدة</th>
                        <th className="p-4 text-sm">تاريخ الاستلام</th>
                        <th className="p-4 text-sm">الحالة</th>
                        <th className="p-4 text-sm">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {assets.map((asset: any, index: number) => (
                        <tr key={asset._id} className="hover:bg-slate-50 print:hover:bg-transparent">
                          <td className="p-4 text-sm font-bold text-slate-500">{index + 1}</td>
                          <td className="p-4 text-sm font-bold text-slate-900">{asset.systemId}</td>
                          <td className="p-4 text-sm font-bold text-slate-800">{asset.name}</td>
                          <td className="p-4 text-sm text-slate-600">
                            {asset.custodyStartDate ? new Date(asset.custodyStartDate).toLocaleDateString('ar-EG') : 'غير مسجل'}
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            {asset.condition === 'excellent' ? 'ممتاز' :
                             asset.condition === 'good' ? 'جيد' :
                             asset.condition === 'needs_repair' ? 'يحتاج إصلاح' :
                             asset.condition === 'scrapped' ? 'تالف' : asset.condition}
                          </td>
                          <td className="p-4 text-sm text-slate-400">.......................</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center">
                  <p className="text-slate-500 font-bold text-lg">لا توجد أي عهد مسجلة باسم هذا الموظف حالياً.</p>
                </div>
              )}
            </div>

            {/* Signatures Area */}
            {assets.length > 0 && (
              <div className="mt-16 grid grid-cols-2 gap-12 text-center pt-8 border-t border-slate-200 print:break-inside-avoid">
                <div>
                  <h4 className="font-bold text-slate-700 mb-8">إقرار المستلم (الموظف)</h4>
                  <p className="text-sm text-slate-500 mb-6">أقر أنا الموقع أدناه باستلام العهد المذكورة أعلاه بحالة جيدة وأتعهد بالحفاظ عليها وإعادتها عند الطلب.</p>
                  <div className="inline-block border-b-2 border-slate-400 border-dashed w-48 pb-2">
                    <span className="text-slate-300 text-sm">التوقيع</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-8">اعتماد الإدارة (أمين المخزن / المدير)</h4>
                  <p className="text-sm text-slate-500 mb-6">أقر بتسليم العهد المذكورة أعلاه للموظف بعد فحصها والتأكد من سلامتها.</p>
                  <div className="inline-block border-b-2 border-slate-400 border-dashed w-48 pb-2 mt-4">
                    <span className="text-slate-300 text-sm">التوقيع / الختم</span>
                  </div>
                </div>
              </div>
            )}
            
          </CardBody>
        </Card>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}} />
    </div>
  );
}
