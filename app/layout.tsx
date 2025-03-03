import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { UserAuthProvider } from '@/components/user-auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BookSurfer - AI-Enhanced Reading Platform',
  description: 'Discover, read, and listen to books with AI-powered features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserAuthProvider>
            {children}
            <Toaster />
          </UserAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}