import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { UserProvider } from '@/hooks/useCurrentUser';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Taskify — チームかんばんボード',
  description:
    'チームの生産性向上プラットフォーム。かんばんボードでタスク管理、担当者割り当て、コメント機能を提供します。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          <div className="min-h-screen bg-gray-50">
            <header className="border-b border-gray-200 bg-white">
              <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
                <h1 className="text-xl font-bold text-indigo-600">Taskify</h1>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
