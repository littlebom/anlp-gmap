'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/map');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold">ANLP Learning Map</h1>
      <p className="mb-8 max-w-lg text-center text-gray-400">
        แผนที่การเรียนรู้แบบ AI-Powered ที่เชื่อมโยงอาชีพ คอร์ส
        และทักษะเข้าด้วยกัน
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-gray-700 px-6 py-3 font-medium transition-colors hover:bg-gray-600"
        >
          สมัครสมาชิก
        </Link>
      </div>
    </main>
  );
}
