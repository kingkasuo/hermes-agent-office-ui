import type { Metadata } from 'next';
import { ThemeProvider, I18nProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hermes Agent Office',
  description: 'Pixel-style AI Agent Monitoring Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}