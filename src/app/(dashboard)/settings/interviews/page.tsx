'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

/* ---------------- Dynamic imports ---------------- */

const InterviewMeetingSettings = dynamic(
  () =>
    import('@/components/interview-meeting-settings').then(
      m => m.InterviewMeetingSettings
    ),
  {
    ssr: false,
    loading: () => <SectionSkeleton />,
  }
);

const InterviewRubricsSettings = dynamic(
  () =>
    import('@/components/interview-rubrics-settings').then(
      m => m.InterviewRubricsSettings
    ),
  {
    ssr: false,
    loading: () => <SectionSkeleton />,
  }
);

/* ---------------- Skeleton ---------------- */

function SectionSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      <div className="space-y-3">
        <div className="h-24 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function InterviewSettingsPage() {
  const { user } = useAuth();
  const { schoolId } = useAuthStore();
  const router = useRouter();

  const [section, setSection] = useState<'meeting' | 'rubrics'>('meeting');

  /* ---------- Guard ---------- */
  useEffect(() => {
    if (user && !schoolId) {
      toast.error('Select an organization to continue');
      router.push('/select-organization');
    }
  }, [user, schoolId, router]);

  if (!schoolId) return null;

  return (
    <div className="flex h-full w-full bg-background">

      {/* ---------------- Desktop Section Nav ---------------- */}
      <aside className="hidden md:flex w-64 shrink-0 border-r bg-muted/20">
        <div className="w-full p-4 space-y-1">
          <SectionButton
            active={section === 'meeting'}
            onClick={() => setSection('meeting')}
            title="Meeting"
            subtitle="Interview scheduling & links"
          />
          <SectionButton
            active={section === 'rubrics'}
            onClick={() => setSection('rubrics')}
            title="Rubrics"
            subtitle="Evaluation criteria"
          />
        </div>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 overflow-y-auto">

        {/* ---------- Mobile Section Selector ---------- */}
        <div className="md:hidden border-b bg-background sticky top-0 z-10">
          <div className="flex">
            <MobileSectionButton
              active={section === 'meeting'}
              onClick={() => setSection('meeting')}
              label="Meeting"
            />
            <MobileSectionButton
              active={section === 'rubrics'}
              onClick={() => setSection('rubrics')}
              label="Rubrics"
            />
          </div>
        </div>

        {/* ---------- Section Content ---------- */}
        <div className="max-w-6xl mx-auto">
          {section === 'meeting' && (
            <InterviewMeetingSettings schoolId={schoolId} />
          )}
          {section === 'rubrics' && <InterviewRubricsSettings />}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Components ---------------- */

function SectionButton({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition',
        active
          ? 'border-primary bg-background shadow-sm'
          : 'border-transparent hover:bg-muted'
      )}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </button>
  );
}

function MobileSectionButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 py-3 text-sm font-medium border-b-2 transition',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground'
      )}
    >
      {label}
    </button>
  );
}
