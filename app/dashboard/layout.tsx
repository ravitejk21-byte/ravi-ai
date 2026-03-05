'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { samplePrompts, sampleEngagements } from '@/lib/sample-data';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { prompts, engagements, addPrompt, addEngagement } = useAppStore();

  // Initialize sample data if empty
  useEffect(() => {
    if (prompts.length === 0) {
      samplePrompts.forEach(addPrompt);
    }
    if (engagements.length === 0) {
      sampleEngagements.forEach(addEngagement);
    }
  }, [prompts.length, engagements.length, addPrompt, addEngagement]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
