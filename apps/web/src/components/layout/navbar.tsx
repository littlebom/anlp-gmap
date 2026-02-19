'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/map" className="flex items-center gap-2 font-bold text-white">
          <span className="text-xl">ANLP</span>
          <span className="text-sm text-blue-400">Learning Map</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/map" className="text-sm text-gray-300 hover:text-white">
            Map
          </Link>
          <Link href="/generate" className="text-sm text-gray-300 hover:text-white">
            Generate
          </Link>
          <Link href="/curator" className="text-sm text-gray-300 hover:text-white">
            Curator
          </Link>
          <Link href="/settings" className="text-sm text-gray-300 hover:text-white">
            Settings
          </Link>
          <div className="ml-4 flex items-center gap-3 border-l border-gray-700 pl-4">
            <span className="text-sm text-gray-400">{user?.name}</span>
            <button
              onClick={logout}
              className="rounded bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
