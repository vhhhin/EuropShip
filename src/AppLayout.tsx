import React from 'react';
import { TimeTrackingProvider } from '@/contexts/TimeTrackingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TimeTrackingProvider>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <Header />
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
          {/* Footer, etc. */}
        </div>
      </AuthProvider>
    </TimeTrackingProvider>
  );
}