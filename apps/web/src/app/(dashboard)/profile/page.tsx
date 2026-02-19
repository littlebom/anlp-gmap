'use client';

import { useAuthStore } from '@/stores/auth-store';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile</h1>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400">Name</label>
            <p className="text-white">{user?.name}</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Role</label>
            <p className="text-white">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
