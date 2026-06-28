'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { useAssets } from '@/app/hooks/useApi';
import { Button, Loading } from '@/app/components';
import { Printer, ArrowLeft } from 'lucide-react';

export default function BulkPrintQRCodesPage() {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedIds = sessionStorage.getItem('printAssetIds');
    if (storedIds) {
      try {
        setIds(JSON.parse(storedIds));
      } catch (e) {
        console.error('Failed to parse asset IDs');
      }
    } else {
      router.push('/assets');
    }
  }, [router]);

  const { data: assetsData, isLoading } = useAssets(
    undefined, undefined, undefined, undefined, undefined, undefined, ids.length > 0 ? ids : undefined, 1, 100
  );

  if (!isClient || isLoading) return <Loading />;

  const assets = assetsData?.data || [];

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-8 print:p-0">
      {/* Non-printable header actions */}
      <div className="max-w-4xl mx-auto mb-8 print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">طباعة ملصقات الباركود</h1>
          <p className="text-sm text-slate-500">تم تحديد {assets.length} ملصق</p>
        </div>

        <Button 
          variant="primary" 
          onClick={() => window.print()}
          className="flex items-center gap-2 font-bold shadow-md shadow-blue-500/30"
        >
          <Printer className="w-5 h-5" />
          طباعة الآن
        </Button>
      </div>

      {/* Printable Area - A4 Optimized */}
      <div className="max-w-[210mm] mx-auto bg-white print:shadow-none print:w-full">
        {/* A4 sheet styling grid */}
        <div className="grid grid-cols-3 gap-4 print:gap-4 p-4 print:p-0">
          {assets.map((asset: any) => {
            const qrUrl = `${window.location.origin}/assets/${asset.systemId || asset._id}`;
            return (
              <div 
                key={asset._id} 
                className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-lg break-inside-avoid text-center bg-white"
              >
                <div className="mb-2 p-2 bg-white rounded-lg">
                  <QRCode 
                    value={qrUrl} 
                    size={120}
                    level="Q"
                    className="w-[120px] h-[120px]"
                  />
                </div>
                <p className="text-sm font-bold text-slate-900 truncate w-full px-2" dir="rtl">{asset.name}</p>
                <p className="text-xs font-mono text-slate-500 mt-1">{asset.systemId}</p>
                <p className="text-[10px] text-slate-400 mt-1">Omega Covenant</p>
              </div>
            );
          })}
        </div>
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
            margin: 10mm;
          }
        }
      `}} />
    </div>
  );
}
