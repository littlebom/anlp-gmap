import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANLP Learning Map',
  description: 'AI-Native Adaptive Learning Platform - Learning Map',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
