'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ReleaseNotesButton } from '@/components/release-notes-dialog';

export function GlobalHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <ReleaseNotesButton isAdmin={true} />
    </header>
  );
}
