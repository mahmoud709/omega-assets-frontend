'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useProject, useInventoryReport } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Table, TableHead, TableBody, TableRow, TableCell, Loading } from '@/app/components';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

export default function ProjectDetailPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: projectData, isLoading: projectLoading } = useProject(projectId);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryReport(projectId);

  if (authLoading || projectLoading || inventoryLoading) return <Loading />;

  const project = projectData?.project;
  const inventory = inventoryData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex gap-4">
            {project && (
              <Link href={`/projects/${project._id}/print`}>
                <Button variant="primary" className="flex items-center gap-2 font-bold shadow-md shadow-blue-500/20">
                  <Printer className="w-5 h-5" />
                  طباعة ملصقات QR
                </Button>
              </Link>
            )}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              العودة
            </button>
          </div>

        {project && (
          <div className="space-y-8">
            {/* Main Project Card */}
            <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-white/90 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <CardHeader className="pt-8 pb-4">
                <CardTitle className="text-2xl font-bold text-slate-900 text-right" dir="rtl">
                  مشروع {project.name}
                </CardTitle>
              </CardHeader>
              <CardBody className="px-8 pb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">الموقع</p>
                    <p className="text-xl font-bold text-slate-900">{project.location}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">الحالة</p>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                        project.isActive 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {project.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {project.description && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-right" dir="rtl">
                    <p className="text-sm text-slate-500 mb-2">الوصف</p>
                    <p className="text-slate-800 leading-relaxed font-medium">{project.description}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Inventory Summary Card */}
            {inventory && (
              <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 py-4 px-6 text-right" dir="rtl">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
                      {inventory.totalAssets} أصل
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">ملخص الجرد</CardTitle>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-right" dir="rtl">
                    {inventory.byCategory?.length > 0 ? (
                      inventory.byCategory.map((cat: any) => (
                        <div key={cat.category} className="group p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                          <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                            {cat.category}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-blue-500">{cat.count}</span>
                            <span className="text-sm text-slate-500 font-medium">أصول</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 w-full col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        لا توجد أصول في هذا المشروع حتى الآن
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
