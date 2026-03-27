'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Layout,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: '대시보드', icon: LayoutDashboard, href: '/dashboard' },
  { label: '거래처 관리', icon: Users, href: '/contacts' },
  { label: '서류 관리', icon: FileText, href: '/documents' },
  { label: '템플릿', icon: Layout, href: '/templates' },
  { label: 'AI 서류 작성', icon: MessageSquare, href: '/chat' },
  { label: '데이터 업로드', icon: Upload, href: '/upload' },
  { label: '설정', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-slate-900 text-white
          flex flex-col transition-all duration-300 ease-in-out
          pb-[env(safe-area-inset-bottom)]
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-slate-700/50">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex-shrink-0 w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg">
              D
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold tracking-tight">DocuFlow</h1>
                <p className="text-xs text-slate-400">서류 자동화</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium
                  transition-all duration-150 group
                  ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout */}
        <div className="px-3 py-3 border-t border-slate-700/50">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? '로그아웃' : undefined}
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            {!collapsed && <span>로그아웃</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex items-center justify-center py-4 border-t border-slate-700/50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Mobile toggle button - exposed for Header to use */}
      <button
        className="lg:hidden fixed top-3 left-3 z-30 p-2.5 bg-slate-900 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="메뉴 열기"
        id="mobile-menu-toggle"
        style={{ display: mobileOpen ? 'none' : undefined }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
