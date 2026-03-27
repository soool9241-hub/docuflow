'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';

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
  const title = getPageTitle(pathname);
  const [notificationCount] = useState(3);

  const handleMobileMenuToggle = () => {
    const btn = document.getElementById('mobile-menu-toggle');
    if (btn) btn.click();
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 lg:px-8">
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
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
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

        {/* Right: Notifications */}
        <div className="flex items-center gap-2">
          <button
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="알림"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 min-w-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User avatar */}
          <div className="ml-2 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
              관
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
