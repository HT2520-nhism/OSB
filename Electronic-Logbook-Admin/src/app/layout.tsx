import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Hệ thống Quản lý Nhật ký Điện tử & Biểu mẫu Cảng cá (eLogbook)',
  description: 'Cổng thông tin quản trị, kiểm soát tàu cá rời/cập cảng và phê duyệt biểu mẫu quy chuẩn IUU',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased bg-slate-50 text-slate-900">
      <body className="min-h-full flex flex-row">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
