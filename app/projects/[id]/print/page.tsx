'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useProject, useInventoryReport } from '@/app/hooks/useApi';
import { Loading } from '@/app/components';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function PrintLabelsPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: projectData, isLoading: projectLoading } = useProject(projectId);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryReport(projectId);

  if (authLoading || projectLoading || inventoryLoading) return <Loading />;

  const project = projectData?.project;
  // inventoryData.byCategory contains arrays of assets. We need to flatten them.
  const categories = inventoryData?.byCategory || [];
  let allAssets: any[] = [];
  categories.forEach((cat: any) => {
    if (cat.assets) allAssets = [...allAssets, ...cat.assets];
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Non-printable header */}
      <div className="print:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-200 bg-white shadow-sm mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">طباعة ملصقات المشروع</h1>
            <p className="text-slate-500 mt-1">{project?.name}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-4 py-2"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded shadow-md"
            >
              <Printer className="w-5 h-5" />
              طباعة الآن
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm text-blue-600 bg-blue-50 p-3 rounded font-medium text-right border border-blue-100" dir="rtl">
          نصيحة: تأكد من إعدادات الطباعة أن تكون بدون هوامش (No Margins) وأن يكون الخيار "طباعة الرسومات الخلفية" (Print Background Graphics) مفعلاً.
        </p>
      </div>

      {/* Printable Area */}
      <div className="max-w-5xl mx-auto bg-white p-8 print:p-0 print:m-0 print:max-w-none print:shadow-none shadow-lg min-h-[A4]">
        <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-6 print:gap-4 text-right" dir="rtl">
          {allAssets.length > 0 ? (
            allAssets.map((asset: any) => {
              const qrValue = `العهدة: ${asset.name}\nالمسئول: ${asset.currentCustodianId?.fullName || asset.custodianName || 'المخزن'}\nرقم النظام: ${asset.systemId}`;
              
              return (
                <div key={asset._id} className="border-2 border-dashed border-slate-300 p-4 rounded flex flex-col items-center break-inside-avoid text-center">
                  <div className="font-bold text-slate-900 text-lg mb-1 truncate w-full">{asset.name}</div>
                  <div className="text-xs text-slate-500 font-medium mb-3">{asset.systemId}</div>
                  
                  <div className="bg-white p-2 border border-slate-200 rounded mb-3">
                    <QRCode value={qrValue} size={120} level="M" />
                  </div>
                  
                  <div className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full w-full truncate">
                    {asset.currentCustodianId?.fullName || asset.custodianName || 'المخزن'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">OMEGA ERP SYSTEM</div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-slate-500 py-20 font-bold print:hidden">
              لا توجد أصول في هذا المشروع للطباعة
            </div>
          )}
        </div>
      </div>
      
      {/* Print-specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .max-w-5xl {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .max-w-5xl * {
            visibility: visible;
          }
        }
      `}} />
    </div>
  );
}
