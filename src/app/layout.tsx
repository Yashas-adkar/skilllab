import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider } from '@/auth/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HelpChatbot } from '@/components/layout/HelpChatbot';

export const metadata: Metadata = {
  title: 'SkillLab | AI Mock Interview Platform',
  description:
    'Comprehensive AI-powered interview preparation across Resume Analysis, Aptitude Testing, Coding, and Technical Mock Interviews.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('skilllab-theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored ? stored : (prefersDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased flex flex-col selection:bg-indigo-500/20 selection:text-indigo-800 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-200">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            <HelpChatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

