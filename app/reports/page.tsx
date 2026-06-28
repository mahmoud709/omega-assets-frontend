'use client';

import { useProtectedRoute, useRequireRole } from '@/app/hooks/useProtected';
import { useAssets, useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Loading } from '@/app/components';
import Link from 'next/link';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#f43f5e'];

export default function ReportsPage() {
  const { user, isLoading: authLoading } = useRequireRole(['admin']);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { data: projectsData } = useProjects(1, 100);
  // Fetch up to 5000 assets to compute analytics safely on frontend
  const { data: assetsData, isLoading: assetsLoading } = useAssets(selectedProjectId || undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, 5000);

  if (authLoading || assetsLoading) return <div className="p-8 text-center text-slate-500 font-medium">جاري التحميل...</div>;

  const projects = projectsData?.data || [];
  const assets = assetsData?.data || [];

  // Compute Analytics
  const totalAssets = assets.length;
  
  const conditionCount: any = {
    excellent: 0,
    good: 0,
    needs_repair: 0,
    scrapped: 0
  };
  
  const categoryCount: Record<string, number> = {};
  let assignedCount = 0;
  
  assets.forEach((a: any) => {
    if (a.condition) conditionCount[a.condition]++;
    if (a.currentCustodianId || (a.custodianName && a.custodianName !== 'المخزن')) assignedCount++;
    
    // category object from backend usually populated, fallback to string if not
    const catName = typeof a.categoryId === 'object' ? a.categoryId?.path || a.categoryId?.name : 'غير مصنف';
    categoryCount[catName] = (categoryCount[catName] || 0) + 1;
  });

  const conditionChartData = [
    { name: 'ممتاز', count: conditionCount.excellent, fill: '#10b981' },
    { name: 'جيد', count: conditionCount.good, fill: '#3b82f6' },
    { name: 'يحتاج إصلاح', count: conditionCount.needs_repair, fill: '#f59e0b' },
    { name: 'تالف', count: conditionCount.scrapped, fill: '#ef4444' }
  ].filter(item => item.count > 0);

  const categoryChartData = Object.entries(categoryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // sort by highest count

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right" dir="rtl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">التقارير والتحليلات الشاملة</h1>

        {/* Project Filter */}
        <Card className="mb-8 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90">
          <CardBody className="p-6">
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تصفية البيانات حسب المشروع
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-100"
                disabled={projects.length === 1 && !!user?.siteId}
              >
                <option value="">جميع المشاريع</option>
                {projects.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all group">
            <CardBody className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-semibold mb-2">إجمالي الأصول</p>
                <p className="text-4xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{totalAssets}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all group">
            <CardBody className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-semibold mb-2">في عهدة موظفين</p>
                <p className="text-4xl font-black text-slate-800 group-hover:text-emerald-500 transition-colors">{assignedCount}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all group">
            <CardBody className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-semibold mb-2">غير موزعة (مخزن)</p>
                <p className="text-4xl font-black text-slate-800 group-hover:text-amber-500 transition-colors">{totalAssets - assignedCount}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
              </div>
            </CardBody>
          </Card>

          <Link href="/maintenance" className="block">
            <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all group cursor-pointer h-full">
              <CardBody className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 font-semibold mb-2">أعطال (تحتاج إصلاح)</p>
                  <p className="text-4xl font-black text-slate-800 group-hover:text-red-500 transition-colors">{conditionCount.needs_repair || 0}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>

        {/* Charts */}
        {totalAssets > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Condition Chart */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-800">حالة الأصول</CardTitle>
              </CardHeader>
              <CardBody className="p-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={conditionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                      {conditionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Category Chart */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-800">توزيع الأصول حسب الفئة</CardTitle>
              </CardHeader>
              <CardBody className="p-6 flex flex-col items-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={60}
                      stroke="none"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={70}
                      iconType="circle"
                      formatter={(value, entry, index) => <span className="text-slate-700 font-medium mr-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xl font-bold text-slate-400">لا توجد أصول لعرض تحليلاتها</p>
          </div>
        )}
      </div>
    </div>
  );
}
