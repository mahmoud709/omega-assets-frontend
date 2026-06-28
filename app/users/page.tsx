'use client';

import { useRequireRole } from '@/app/hooks/useProtected';
import { useUsers, useDeleteUser, useUpdateUser, useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Loading } from '@/app/components';
import Link from 'next/link';
import { Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export default function UsersPage() {
  const { user, isLoading: authLoading } = useRequireRole(['admin']);
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const { data: projectsData } = useProjects(1, 100);
  const projects = projectsData?.data || [];

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: '', role: '', siteId: '' });

  if (authLoading || usersLoading) return <Loading />;

  const users = usersData?.data || [];

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload = { ...editForm };
    if (payload.role === 'admin') {
      (payload as any).siteId = null; // Clear siteId for admins
    }

    try {
      await updateUser.mutateAsync({ id: editingUser._id, data: payload });
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              إدارة المستخدمين
            </h1>
            <p className="text-gray-600 mt-2">عرض وإدارة حسابات الموظفين وصلاحياتهم</p>
          </div>
          <Link href="/users/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إنشاء حساب جديد
            </Button>
          </Link>
        </div>

        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-right" dir="rtl">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 text-sm">
                    <th className="pb-3 font-semibold">الاسم</th>
                    <th className="pb-3 font-semibold">البريد الإلكتروني</th>
                    <th className="pb-3 font-semibold">الدور (الصلاحية)</th>
                    <th className="pb-3 font-semibold">المشروع المعين</th>
                    <th className="pb-3 font-semibold">تاريخ الإنشاء</th>
                    <th className="pb-3 font-semibold text-center w-24">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length > 0 ? (
                    users.map((u: any) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition">
                        <td className="py-4 text-gray-900 font-medium">{u.fullName}</td>
                        <td className="py-4 text-gray-600">{u.email}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'site_manager' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role === 'admin' ? 'مسؤول' : u.role === 'site_manager' ? 'مدير موقع' : 'مستخدم'}
                          </span>
                        </td>
                        <td className="py-4 text-gray-600 font-medium text-sm">
                          {u.role === 'admin' ? 'جميع المشاريع (صلاحية كاملة)' : 
                            (projects.find((p: any) => p._id === u.siteId)?.name || 'بدون تعيين')}
                        </td>
                        <td className="py-4 text-gray-600 text-sm">
                          {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingUser(u);
                                setEditForm({ fullName: u.fullName, role: u.role, siteId: u.siteId || '' });
                              }}
                              className="p-2"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                                  deleteUser.mutate(u._id);
                                }
                              }}
                              className="p-2"
                              disabled={u.email === 'admin@admin.com'}
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        لا يوجد مستخدمين
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900">تعديل المستخدم</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الدور (الصلاحية)</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">أمين مخزن (إدخال بيانات)</option>
                    <option value="site_manager">مدير موقع</option>
                    <option value="admin">مسؤول (Admin)</option>
                  </select>
                </div>

                {editForm.role !== 'admin' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      المشروع المخصص (اختياري)
                    </label>
                    <select
                      value={editForm.siteId}
                      onChange={(e) => setEditForm({ ...editForm, siteId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">بدون تعيين (يستطيع رؤية جميع المشاريع)</option>
                      {projects.map((p: any) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      إذا قمت بتعيين مشروع لهذا المستخدم، فلن يتمكن من الوصول لأي مشروع آخر.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={updateUser.isPending}
                >
                  {updateUser.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditingUser(null)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
