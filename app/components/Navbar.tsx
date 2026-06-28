'use client';

import Link from 'next/link';
import { useAuth } from '../context/auth';
import { Menu, LogOut, Home, Package, FolderOpen, Users } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Hide the Navbar completely for unauthenticated visitors (e.g. public QR scans)
  if (!user) return null;

  return (
    <nav className="bg-gray-900 text-white shadow-lg print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            العهد
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 hover:text-blue-400 transition"
                >
                  <Home className="w-4 h-4" />
                  الرئيسية
                </Link>
                <Link
                  href="/assets"
                  className="flex items-center gap-2 hover:text-blue-400 transition"
                >
                  <Package className="w-4 h-4" />
                  الأصول
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center gap-2 hover:text-blue-400 transition"
                >
                  <FolderOpen className="w-4 h-4" />
                  المشاريع
                </Link>
                <Link
                  href="/employees"
                  className="flex items-center gap-2 hover:text-blue-400 transition"
                >
                  <Users className="w-4 h-4" />
                  الموظفين
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/reports"
                    className="flex items-center gap-2 hover:text-blue-400 transition"
                  >
                    <Users className="w-4 h-4" />
                    التقارير
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/users"
                    className="flex items-center gap-2 hover:text-blue-400 transition"
                  >
                    <Users className="w-4 h-4" />
                    المستخدمين
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-gray-300">{user.fullName}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            )}
            <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {isOpen && user && (
          <div className="md:hidden pb-4 flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 py-3 border-b border-gray-700 mb-2">
              <span className="text-sm text-gray-300 font-medium">{user.fullName}</span>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-red-600 px-3 py-1.5 text-sm rounded hover:bg-red-700 transition"
              >
                <LogOut className="w-4 h-4" />
                خروج
              </button>
            </div>
            <Link href="/dashboard" className="block px-2 py-2 hover:bg-gray-800 rounded">
              الرئيسية
            </Link>
            <Link href="/assets" className="block px-2 py-2 hover:bg-gray-800 rounded">
              الأصول
            </Link>
            <Link href="/projects" className="block px-2 py-2 hover:bg-gray-800 rounded">
              المشاريع
            </Link>
            <Link href="/employees" className="block px-2 py-2 hover:bg-gray-800 rounded">
              الموظفين
            </Link>
            {user.role === 'admin' && (
              <Link href="/reports" className="block px-2 py-2 hover:bg-gray-800 rounded">
                التقارير
              </Link>
            )}
            {user.role === 'admin' && (
              <Link href="/users" className="block px-2 py-2 hover:bg-gray-800 rounded">
                المستخدمين
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
