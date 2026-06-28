'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Table, TableHead, TableBody, TableRow, TableCell, Loading, Error } from '@/app/components';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/app/lib/api';
import { Eye, Plus, Trash2 } from 'lucide-react';

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const [page, setPage] = useState(1);
  const { data: projectsData, isLoading, error } = useProjects(page, 20);

  if (authLoading || isLoading) return <Loading />;
  if (error) return <Error message="Failed to load projects" />;

  const projects = projectsData?.data || [];
  const pagination = projectsData?.pagination || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">المشاريع</h1>
          {user?.role === 'admin' && (
            <Link href="/projects/new">
              <Button variant="success" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                إنشاء مشروع
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardBody>
            {projects.length > 0 ? (
              <>
                <Table>
                  <TableHead>
                    <TableRow className="text-right" dir="rtl">
                      <TableCell header>الاسم</TableCell>
                      <TableCell header>الموقع</TableCell>
                      <TableCell header>الوصف</TableCell>
                      <TableCell header>الحالة</TableCell>
                      <TableCell header>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((project: any) => (
                      <TableRow key={project._id} className="text-right" dir="rtl">
                        <TableCell className="font-bold text-slate-900">{project.name}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{project.location}</TableCell>
                        <TableCell className="font-medium text-slate-700">{project.description || 'غير متوفر'}</TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded text-sm font-bold ${
                              project.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {project.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/projects/${project._id}`}>
                              <Button variant="secondary" className="flex items-center gap-1 font-semibold">
                                <Eye className="w-4 h-4" />
                                عرض
                              </Button>
                            </Link>
                            {user?.role === 'admin' && (
                              <Button
                                variant="secondary"
                                className="flex items-center gap-1 text-red-600 font-semibold hover:text-red-800 hover:bg-red-50"
                                onClick={async () => {
                                  if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
                                    try {
                                      await api.delete(`/projects/${project._id}`);
                                      window.location.reload();
                                    } catch (err) {
                                      alert('فشل حذف المشروع');
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                حذف
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="mt-6 flex justify-between items-center flex-row-reverse">
                  <span className="text-slate-700 font-medium">
                    عرض {(page - 1) * 20 + 1} إلى {Math.min(page * 20, pagination.total)} من {pagination.total}
                  </span>
                  <div className="flex gap-2 flex-row-reverse">
                    <Button
                      disabled={page >= pagination.pages}
                      onClick={() => setPage(page + 1)}
                      variant="secondary"
                    >
                      التالي
                    </Button>
                    <span className="px-4 py-2 font-medium text-slate-800">صفحة {page}</span>
                    <Button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      variant="secondary"
                    >
                      السابق
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-600 text-right font-medium">لا توجد مشاريع حتى الآن</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
