'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useEmployees, useCreateEmployee, useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Table, TableHead, TableBody, TableRow, TableCell, Loading } from '@/app/components';
import { useState, useEffect } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EmployeesPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const [showAddForm, setShowAddForm] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [employeesList, setEmployeesList] = useState([{ name: '', department: '' }]);

  const { data: projectsData } = useProjects(1, 100);
  const projects = projectsData?.data || [];

  const { data: employeesData, isLoading: employeesLoading } = useEmployees(
    filterProjectId || (user?.role !== 'admin' ? user?.siteId : undefined),
    search || undefined,
    page,
    20
  );
  const employees = employeesData?.data || [];
  const pagination = employeesData?.pagination || { total: 0, page: 1, pages: 1 };

  const createEmployee = useCreateEmployee();

  useEffect(() => {
    if (projects.length === 1 && user?.siteId) {
      setProjectId(projects[0]._id);
    }
  }, [projects, user]);

  const handleEmployeeChange = (index: number, field: string, value: string) => {
    const updated = [...employeesList];
    updated[index] = { ...updated[index], [field]: value };
    setEmployeesList(updated);
  };

  const addEmployeeRow = () => {
    setEmployeesList([...employeesList, { name: '', department: '' }]);
  };

  const removeEmployeeRow = (index: number) => {
    const updated = employeesList.filter((_, i) => i !== index);
    setEmployeesList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || employeesList.length === 0) return;
    
    const validEmployees = employeesList.filter(emp => emp.name.trim() !== '');
    if (validEmployees.length === 0) return;

    try {
      await createEmployee.mutateAsync({ projectId, employees: validEmployees });
      setShowAddForm(false);
      setEmployeesList([{ name: '', department: '' }]);
    } catch (error) {
      alert('فشل إضافة الموظفين');
    }
  };

  if (authLoading || employeesLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            موظفي المشاريع
          </h1>
          <Button variant="success" className="flex items-center gap-2 font-bold" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" />
            إضافة موظفين
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between" dir="rtl">
          <div className="flex gap-4 items-center w-full md:w-auto">
            <label className="font-bold text-slate-700 whitespace-nowrap">تصفية بالمشروع:</label>
            <select
              value={filterProjectId}
              onChange={(e) => { setFilterProjectId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold bg-slate-50"
              disabled={projects.length === 1 && !!user?.siteId}
            >
              <option value="">جميع المشاريع</option>
              {projects.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="بحث باسم الموظف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-slate-50"
            />
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-8 border-t-4 border-t-blue-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-right">إضافة موظفين لعهد المشروع</CardTitle>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6 text-right" dir="rtl">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المشروع *</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full md:w-1/3 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold bg-white"
                    required
                    disabled={projects.length === 1 && !!user?.siteId}
                  >
                    <option value="">اختر المشروع</option>
                    {projects.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {employeesList.map((emp, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="md:col-span-5">
                        <label className="block text-sm font-bold text-slate-700 mb-1">اسم الموظف *</label>
                        <input
                          type="text"
                          value={emp.name}
                          onChange={(e) => handleEmployeeChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                          placeholder="مثال: أحمد محمود"
                          required
                        />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-sm font-bold text-slate-700 mb-1">القسم</label>
                        <input
                          type="text"
                          value={emp.department}
                          onChange={(e) => handleEmployeeChange(index, 'department', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                          placeholder="مثال: الهندسة، تقنية المعلومات..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        {employeesList.length > 1 && (
                          <Button 
                            variant="danger" 
                            type="button" 
                            onClick={() => removeEmployeeRow(index)}
                            className="w-full h-11 flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-between pt-4 border-t border-slate-200">
                  <Button variant="secondary" type="button" onClick={addEmployeeRow} className="flex items-center gap-2 font-bold">
                    <Plus className="w-4 h-4" />
                    إضافة صف آخر
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowAddForm(false)}>إلغاء</Button>
                    <Button variant="success" type="submit" disabled={createEmployee.isPending} className="font-bold">
                      {createEmployee.isPending ? 'جاري الحفظ...' : 'حفظ الموظفين'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            {employees.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow className="text-right" dir="rtl">
                    <TableCell header>اسم الموظف</TableCell>
                    <TableCell header>المشروع</TableCell>
                    <TableCell header>القسم</TableCell>
                    <TableCell header>إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp: any) => (
                    <TableRow key={emp._id} className="text-right" dir="rtl">
                      <TableCell className="font-bold text-slate-900">{emp.name}</TableCell>
                      <TableCell className="text-slate-800">{emp.projectId?.name || 'غير معروف'}</TableCell>
                      <TableCell className="text-slate-600">{emp.department || 'غير متوفر'}</TableCell>
                      <TableCell>
                        <Link href={`/employees/${emp._id}`}>
                          <Button variant="primary" className="text-sm py-1.5 px-3 font-bold shadow-sm shadow-blue-500/30">
                            كشف العهدة
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="mt-6 flex justify-between items-center print:hidden" dir="rtl">
                  <span className="text-slate-700 font-medium">
                    عرض {(page - 1) * 20 + 1} إلى {Math.min(page * 20, pagination.total)} من {pagination.total}
                  </span>
                  <div className="flex gap-2">
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
              )}
            </div>
            ) : (
              <p className="text-slate-600 text-right font-medium">لا يوجد موظفين مسجلين حالياً</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
