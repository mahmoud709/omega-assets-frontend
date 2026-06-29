'use client';

import { useProtectedRoute } from '@/app/hooks/useProtected';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Table, TableHead, TableBody, TableRow, TableCell, Loading } from '@/app/components';
import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Pencil, X } from 'lucide-react';
import Link from 'next/link';

export default function EmployeesPage() {
  const { user, isLoading: authLoading } = useProtectedRoute();
  const [showAddForm, setShowAddForm] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [employeesList, setEmployeesList] = useState<any[]>([{ name: '', department: '', isOffice: false, members: [], memberSearch: '' }]);

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
  
  // Extract unique departments for the smart dropdown
  const existingDepartments = Array.from(new Set(employees.map((emp: any) => emp.department).filter(Boolean)));

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
      await updateEmployee.mutateAsync({
        id: editingEmployee._id,
        data: {
          name: editingEmployee.name,
          department: editingEmployee.department,
          projectId: editingEmployee.projectId,
          isOffice: editingEmployee.isOffice,
          members: editingEmployee.members,
        }
      });
      setEditingEmployee(null);
    } catch (error) {
      console.error('Failed to update employee:', error);
      alert('فشل في تحديث بيانات الموظف');
    }
  };

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
    setEmployeesList([...employeesList, { name: '', department: '', isOffice: false, members: [], memberSearch: '' }]);
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

  if (authLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            مستلمي العهد / الموظفين
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
                      <div className={emp.isOffice ? "md:col-span-12" : "md:col-span-5"}>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {emp.isOffice ? 'اسم المكتب / الكيان *' : 'اسم الموظف / الجهة (مثل: المكتب الفني) *'}
                        </label>
                        <input
                          type="text"
                          value={emp.name}
                          onChange={(e) => handleEmployeeChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                          placeholder={emp.isOffice ? "مثال: المكتب الفني، مخزن المشروع..." : "مثال: أحمد محمود"}
                          required
                        />
                      </div>
                      {!emp.isOffice && (
                        <div className="md:col-span-5">
                          <label className="block text-sm font-bold text-slate-700 mb-1">القسم (اختياري)</label>
                          <input
                            type="text"
                            list="departments-list"
                            value={emp.department}
                            onChange={(e) => handleEmployeeChange(index, 'department', e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                            placeholder="اختر أو اكتب قسم جديد..."
                          />
                          <datalist id="departments-list">
                            {existingDepartments.map((dept: any, i) => (
                              <option key={i} value={dept} />
                            ))}
                          </datalist>
                        </div>
                      )}
                      
                      {/* Is Office Checkbox */}
                      <div className="md:col-span-12 flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          checked={emp.isOffice} 
                          onChange={(e) => handleEmployeeChange(index, 'isOffice', e.target.checked)} 
                          id={`isOffice-${index}`}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                        <label htmlFor={`isOffice-${index}`} className="text-sm font-bold text-slate-700">
                          هذا كيان / مكتب (يحتوي على عدة أشخاص يوقعون على العهدة)
                        </label>
                      </div>

                      {/* Members Selection (if isOffice) */}
                      {emp.isOffice && (
                        <div className="md:col-span-12 bg-white p-4 rounded-lg border border-slate-200 mt-2 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-bold text-slate-700">اختر الأشخاص الذين سيوقعون على العهدة:</label>
                            <input
                              type="text"
                              value={emp.memberSearch || ''}
                              onChange={(e) => handleEmployeeChange(index, 'memberSearch', e.target.value)}
                              placeholder="بحث بالاسم أو القسم..."
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto p-1">
                            {employees
                              .filter((e: any) => !e.isOffice)
                              .filter((e: any) => !emp.memberSearch || e.name.includes(emp.memberSearch) || (e.department && e.department.includes(emp.memberSearch)))
                              .map((e: any) => (
                              <label key={e._id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100">
                                <input 
                                  type="checkbox"
                                  checked={emp.members.includes(e._id)}
                                  onChange={(evt) => {
                                    const checked = evt.target.checked;
                                    let newMembers = [...emp.members];
                                    if (checked) newMembers.push(e._id);
                                    else newMembers = newMembers.filter((m: string) => m !== e._id);
                                    handleEmployeeChange(index, 'members', newMembers);
                                  }}
                                />
                                <span className="text-sm font-bold text-slate-800">{e.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-12 flex justify-end">
                        {employeesList.length > 1 && (
                          <Button 
                            variant="danger" 
                            type="button" 
                            onClick={() => removeEmployeeRow(index)}
                            className="h-11 flex items-center justify-center gap-2 px-6"
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف هذا الصف
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
            {employeesLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : employees.length > 0 ? (
              <>
                <Table>
                <TableHead>
                  <TableRow className="text-right" dir="rtl">
                    <TableCell header>المستلم / الجهة</TableCell>
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
                        <div className="flex gap-2">
                          <Link href={`/employees/${emp._id}`}>
                            <Button variant="primary" className="text-sm py-1.5 px-3 font-bold shadow-sm shadow-blue-500/30">
                              كشف العهدة
                            </Button>
                          </Link>
                          <Button 
                            variant="secondary" 
                            className="text-sm py-1.5 px-2 bg-slate-100 text-slate-600 hover:bg-slate-200"
                            onClick={() => setEditingEmployee({
                              _id: emp._id,
                              name: emp.name,
                              department: emp.department || '',
                              projectId: (emp.projectId && emp.projectId._id) ? emp.projectId._id : (emp.projectId || ''),
                              isOffice: emp.isOffice || false,
                              members: emp.members ? emp.members.map((m: any) => m._id || m) : [],
                              memberSearch: '',
                            })}
                            title="تعديل البيانات"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
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
              </>
            ) : (
              <p className="text-slate-600 text-right font-medium">لا يوجد موظفين مسجلين حالياً</p>
            )}
          </CardBody>
        </Card>

        {/* Edit Employee Modal */}
        {editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-800">تعديل بيانات الموظف</h3>
                <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم الموظف *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                {!editingEmployee.isOffice && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">القسم / الوظيفة (اختياري)</label>
                    <input
                      type="text"
                      list="edit-departments-list"
                      value={editingEmployee.department}
                      onChange={(e) => setEditingEmployee({...editingEmployee, department: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                      placeholder="اختر أو اكتب قسم جديد..."
                    />
                    <datalist id="edit-departments-list">
                      {existingDepartments.map((dept: any, i) => (
                        <option key={i} value={dept} />
                      ))}
                    </datalist>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المشروع التابع له *</label>
                  <select
                    required
                    value={editingEmployee.projectId}
                    onChange={(e) => setEditingEmployee({...editingEmployee, projectId: e.target.value})}
                    disabled={user?.role !== 'admin'}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold disabled:opacity-50"
                  >
                    <option value="">اختر المشروع...</option>
                    {projects.map((proj: any) => (
                      <option key={proj._id} value={proj._id}>{proj.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    checked={editingEmployee.isOffice} 
                    onChange={(e) => setEditingEmployee({...editingEmployee, isOffice: e.target.checked})} 
                    id="edit-isOffice"
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="edit-isOffice" className="text-sm font-bold text-slate-700">
                    هذا كيان / مكتب (يحتوي على عدة أشخاص)
                  </label>
                </div>

                {editingEmployee.isOffice && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-slate-700">الأشخاص المخولين بالتوقيع:</label>
                      <input
                        type="text"
                        value={editingEmployee.memberSearch || ''}
                        onChange={(e) => setEditingEmployee({...editingEmployee, memberSearch: e.target.value})}
                        placeholder="بحث بالاسم أو القسم..."
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                      {employees
                        .filter((e: any) => !e.isOffice)
                        .filter((e: any) => !editingEmployee.memberSearch || e.name.includes(editingEmployee.memberSearch) || (e.department && e.department.includes(editingEmployee.memberSearch)))
                        .map((e: any) => (
                        <label key={e._id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-50">
                          <input 
                            type="checkbox"
                            checked={editingEmployee.members.includes(e._id)}
                            onChange={(evt) => {
                              const checked = evt.target.checked;
                              let newMembers = [...editingEmployee.members];
                              if (checked) newMembers.push(e._id);
                              else newMembers = newMembers.filter((m: string) => m !== e._id);
                              setEditingEmployee({...editingEmployee, members: newMembers});
                            }}
                          />
                          <span className="text-sm font-bold text-slate-800">{e.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setEditingEmployee(null)}>
                    إلغاء
                  </Button>
                  <Button type="submit" variant="primary" disabled={updateEmployee.isPending}>
                    {updateEmployee.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
