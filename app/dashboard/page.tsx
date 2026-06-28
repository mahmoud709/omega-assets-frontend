'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useProjects, useAssets, useDueMaintenance, useDashboardStats } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Loading, Error } from '@/app/components';
import Link from 'next/link';
import { Package, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const { data: projectsData, isLoading: projectsLoading } = useProjects(1, 5);
  const { data: assetsData, isLoading: assetsLoading } = useAssets(undefined, undefined, undefined, undefined, undefined, 1, 5);
  const { data: maintenanceData, isLoading: maintenanceLoading } = useDueMaintenance();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

  if (authLoading || projectsLoading || assetsLoading || maintenanceLoading || statsLoading) {
    return <Loading />;
  }

  const projects = projectsData?.data || [];
  const assets = assetsData?.data || [];
  const dueMaintenance = maintenanceData?.data || [];
  
  const stats = statsData?.data || { excellent: 0, good: 0, needs_repair: 0, scrapped: 0 };
  
  const pieData = [
    { name: 'ممتاز', value: stats.excellent, color: '#10b981' },
    { name: 'جيد', value: stats.good, color: '#3b82f6' },
    { name: 'يحتاج صيانة', value: stats.needs_repair, color: '#f59e0b' },
    { name: 'تالف / خردة', value: stats.scrapped, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (!percent || percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontWeight: 700, fontSize: 13 }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">مرحباً، {user?.fullName}!</h1>
            <p className="text-slate-600 mt-2 font-medium">إدارة الأصول والمشاريع وتتبع العهد</p>
          </div>

          {/* Action Buttons */}
          {(user?.role === 'admin' || user?.role === 'site_manager') && (
            <div className="flex flex-wrap gap-3">
              <Link href="/assets/new">
                <Button variant="success" className="px-6 shadow-md shadow-green-500/20 font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  إضافة أصل جديد
                </Button>
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link href="/projects/new">
                    <Button variant="success" className="px-6 shadow-md shadow-green-500/20 font-bold flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      إنشاء مشروع
                    </Button>
                  </Link>
                  <Link href="/users">
                    <Button variant="primary" className="px-6 shadow-md shadow-blue-500/20 font-bold flex items-center gap-2">
                      إدارة المستخدمين
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">إجمالي الأصول</p>
                <p className="text-3xl font-bold text-gray-900">{assetsData?.pagination?.total || 0}</p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">المشاريع النشطة</p>
                <p className="text-3xl font-bold text-gray-900">{projectsData?.pagination?.total || 0}</p>
              </div>
              <FolderOpen className="w-12 h-12 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">الصيانة المستحقة</p>
                <p className="text-3xl font-bold text-gray-900">{dueMaintenance.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Chart Section */}
        {pieData.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>حالة الأصول</CardTitle>
              </CardHeader>
              <CardBody className="h-80 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={5}
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      content={(props) => {
                        const { payload } = props;
                        return (
                          <ul className="flex flex-wrap justify-center gap-6 mt-4">
                            {payload?.map((entry, index) => (
                              <li key={`item-${index}`} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: entry.color }} />
                                <span className="text-sm font-medium text-slate-700">{entry.value}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Assets */}
          <Card>
            <CardHeader>
              <CardTitle>أحدث الأصول</CardTitle>
            </CardHeader>
            <CardBody>
              {assets.length > 0 ? (
                <div className="space-y-2">
                  {assets.slice(0, 5).map((asset: any) => (
                    <div key={asset._id} className="p-2 hover:bg-slate-50 rounded flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{asset.name}</p>
                        <p className="text-sm font-medium text-slate-600">{asset.systemId}</p>
                      </div>
                      <Link href={`/assets/${asset._id}`}>
                        <Button variant="secondary" className="font-semibold">عرض</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 font-medium">لا توجد أصول حتى الآن</p>
              )}
              <Link href="/assets" className="mt-4 block">
                <Button variant="primary" className="w-full font-bold">
                  عرض كل الأصول
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>أحدث المشاريع</CardTitle>
            </CardHeader>
            <CardBody>
              {projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.slice(0, 5).map((project: any) => (
                    <div key={project._id} className="p-2 hover:bg-slate-50 rounded flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{project.name}</p>
                        <p className="text-sm font-medium text-slate-600">{project.location}</p>
                      </div>
                      <Link href={`/projects/${project._id}`}>
                        <Button variant="secondary" className="font-semibold">عرض</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 font-medium">لا توجد مشاريع حتى الآن</p>
              )}
              <Link href="/projects" className="mt-4 block">
                <Button variant="primary" className="w-full font-bold">
                  عرض كل المشاريع
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Due Maintenance */}
          {dueMaintenance.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  مهام الصيانة المستحقة
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {dueMaintenance.slice(0, 5).map((task: any) => (
                    <div key={task._id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="font-bold text-slate-900">{task.description}</p>
                      <p className="text-sm font-medium text-slate-700">الأصل: {task.assetId?.name}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
