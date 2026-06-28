'use client';

import { useRequireRole } from '@/app/hooks/useProtected';
import { useCreateUser, useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button } from '@/app/components';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateUserPage() {
  const { user, isLoading: authLoading } = useRequireRole(['admin']);
  const router = useRouter();
  
  const { data: projectsData } = useProjects(1, 100);
  const projects = projectsData?.data || [];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'viewer',
    siteId: '',
  });

  const createUser = useCreateUser();
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If role is admin, clear siteId before sending
    const payload = { ...formData };
    if (payload.role === 'admin') {
      delete (payload as any).siteId;
    }

    try {
      await createUser.mutateAsync(payload);
      router.push('/users');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل إنشاء الحساب');
    }
  };

  if (authLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/users" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          العودة إلى قائمة المستخدمين
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>إنشاء حساب موظف جديد</CardTitle>
          </CardHeader>
          <CardBody>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الصلاحية (الدور) *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="viewer">أمين مخزن (إدخال بيانات)</option>
                  <option value="site_manager">مدير موقع</option>
                  <option value="admin">مسؤول (Admin)</option>
                </select>
              </div>

              {formData.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تعيين لمشروع محدد (اختياري)
                  </label>
                  <select
                    name="siteId"
                    value={formData.siteId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">بدون تعيين (يستطيع رؤية جميع المشاريع)</option>
                    {projects.map((p: any) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    إذا قمت بتعيين مشروع لهذا المستخدم، فلن يتمكن من رؤية أو إضافة أصول في أي مشروع آخر.
                  </p>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <Button variant="success" type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </Button>
                <Link href="/users">
                  <Button variant="secondary">إلغاء</Button>
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
