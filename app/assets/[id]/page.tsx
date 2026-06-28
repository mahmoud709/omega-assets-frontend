'use client';

import { useAuth } from '@/app/context/auth';
import { useAsset, useCustodyHistory, useTransferCustody, useEmployees, useProjects } from '@/app/hooks/useApi';
import { Card, CardHeader, CardTitle, CardBody, Button, Table, TableHead, TableBody, TableRow, TableCell, Loading, Error } from '@/app/components';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function AssetDetailPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  const { data: assetData, isLoading: assetLoading } = useAsset(assetId);
  const { data: historyData, isLoading: historyLoading } = useCustodyHistory(assetId);
  const transferCustody = useTransferCustody();

  const asset = assetData?.asset;
  const history = historyData?.data || [];

  const [toProjectId, setToProjectId] = useState('');
  
  useEffect(() => {
    if (asset?.projectId?._id) {
      setToProjectId(asset.projectId._id);
    }
  }, [asset]);

  const { data: projectsData, isLoading: projectsLoading } = useProjects(1, 100);
  const projects = projectsData?.data || [];

  const { data: employeesData, isLoading: employeesLoading } = useEmployees(toProjectId);
  const employees = employeesData?.data || [];

  const [showTransfer, setShowTransfer] = useState(false);
  const [toUserName, setToUserName] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  if (assetLoading || historyLoading) return <Loading />;
  if (isAuthenticated && (employeesLoading || projectsLoading)) return <Loading />;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await transferCustody.mutateAsync({
        assetId,
        toProjectId,
        toUserName,
        notes: transferNotes,
      });
      setShowTransfer(false);
      setToUserName('');
      setTransferNotes('');
    } catch (error) {
      alert('Transfer failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة
        </button>

        {asset && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Asset Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{asset.name}</CardTitle>
                </CardHeader>
                <CardBody className="space-y-4 text-right">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">المشروع الحالي</p>
                      <p className="text-lg font-bold text-blue-700">{asset.projectId?.name || 'غير محدد'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">معرف النظام (System ID)</p>
                      <p className="text-lg font-bold font-mono text-slate-900">{asset.systemId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">الحالة</p>
                      <p className="text-lg font-bold text-slate-900 capitalize">
                        {asset.condition === 'excellent' ? 'ممتاز' :
                         asset.condition === 'good' ? 'جيد' :
                         asset.condition === 'needs_repair' ? 'يحتاج صيانة' :
                         asset.condition === 'scrapped' ? 'تالف / خردة' : asset.condition}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">الرقم التسلسلي</p>
                      <p className="text-lg font-bold text-slate-900">{asset.serialNumber || 'غير متوفر'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">تكلفة الشراء</p>
                      <p className="text-lg font-bold text-slate-900">EGP {asset.purchaseCost?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">المورد</p>
                      <p className="text-lg font-bold text-slate-900">{asset.vendor || 'غير متوفر'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">العهدة الحالية (المسؤول)</p>
                      <p className="text-lg font-bold text-slate-900">
                        {asset.currentCustodianId?.fullName || asset.custodianName || 'في المخزن'}
                      </p>
                    </div>
                  </div>

                  {asset.specifications && Object.keys(asset.specifications).length > 0 && (
                    <div className="border-t border-slate-200 pt-4 mt-6">
                      <p className="font-bold text-slate-900 mb-2">المواصفات</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(asset.specifications).map(([key, value]) => (
                          <p key={key} className="text-slate-900 font-medium">
                            <span className="text-slate-500">{key}:</span> {String(value)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Custody History */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-right" >سجل العهدة والتنقلات</CardTitle>
                </CardHeader>
                <CardBody>
                  {history.length > 0 ? (
                    <Table>
                      <TableHead>
                        <TableRow className="text-right" >
                          <TableCell header>المشروع المستلم</TableCell>
                          <TableCell header>من موظف</TableCell>
                          <TableCell header>إلى موظف</TableCell>
                          <TableCell header>التاريخ</TableCell>
                          <TableCell header>ملاحظات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {history.map((log: any) => (
                          <TableRow key={log._id} className="text-right" >
                            <TableCell className="font-bold text-blue-700">{log.toProjectId?.name || '-'}</TableCell>
                            <TableCell>{log.fromUserId?.fullName || log.fromUserName || 'المخزن'}</TableCell>
                            <TableCell>{log.toUserId?.fullName || log.toUserName || 'المخزن'}</TableCell>
                            <TableCell>
                              {new Date(log.transferredAt).toLocaleDateString('ar-EG')}
                            </TableCell>
                            <TableCell>{log.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-600 text-right" dir="rtl">لا يوجد سجل تنقلات لهذا الأصل</p>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* QR Code & Transfer */}
            <div className="space-y-6">
              {isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right" >رمز الاستجابة السريعة (QR)</CardTitle>
                  </CardHeader>
                  <CardBody className="flex justify-center bg-white p-4 rounded-xl border border-slate-100">
                    {asset && (
                      <QRCode 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/assets/${asset._id}`} 
                        size={200} 
                        level="H" 
                      />
                    )}
                  </CardBody>
                </Card>
              )}

              {isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right" >أمر نقل (عهدة / مشروع)</CardTitle>
                  </CardHeader>
                  <CardBody>
                    {!showTransfer ? (
                      <Button
                        variant="success"
                        onClick={() => setShowTransfer(true)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        إصدار أمر نقل
                      </Button>
                    ) : (
                      <form onSubmit={handleTransfer} className="space-y-4 text-right" dir="rtl">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            نقل إلى مشروع (اختياري)
                          </label>
                          <select
                            value={toProjectId}
                            onChange={(e) => {
                               setToProjectId(e.target.value);
                               setToUserName(''); // Reset employee when project changes
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-right bg-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">نفس المشروع الحالي</option>
                            {projects.map((proj: any) => (
                              <option key={proj._id} value={proj._id}>{proj.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            اسم الموظف المستلم (اختياري)
                          </label>
                          <select
                            value={toUserName}
                            onChange={(e) => setToUserName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-right bg-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">إرجاع إلى المخزن</option>
                            {employees.map((emp: any) => (
                              <option key={emp._id} value={emp.name}>{emp.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            سبب النقل / ملاحظات
                          </label>
                          <textarea
                            value={transferNotes}
                            onChange={(e) => setTransferNotes(e.target.value)}
                            placeholder="سبب نقل العهدة..."
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="success"
                            type="submit"
                            disabled={transferCustody.isPending}
                            className="flex-1"
                          >
                            {transferCustody.isPending ? 'جاري النقل...' : 'تأكيد النقل'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setShowTransfer(false)}
                            className="flex-1"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
