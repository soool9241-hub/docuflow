'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/layout/NotificationBell';

const routeTitles: Record<string, string> = {
  '/dashboard': '대시보드',
  '/contacts': '거래처 관리',
  '/documents': '서류 관리',
  '/chat': 'AI 서류 작성',
  '/upload': '데이터 업로드',
  '/settings': '설정',
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return '대시보드';

  for (const [route, title] of Object.entries(routeTitles)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return title;
    }
  }
  return '대시보드';
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMobileMenuToggle = () => {
    const btn = document.getElementById('mobile-menu-toggle');
    if (btn) btn.click();
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-3 py-2 lg:px-8 lg:py-3">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={handleMobileMenuToggle}
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">{title}</h2>
          </div>
        </div>

        {/* Center: Search bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="서류, 거래처 검색..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                         focus:border-transparent focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          {/* User avatar */}
          <div className="ml-2 hidden sm:flex items-center gap-2 relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold hover:bg-indigo-200 transition-colors"
              title={user?.email || ''}
            >
              {userInitial}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400">로그인 계정</p>
                  <p className="text-sm text-gray-700 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
