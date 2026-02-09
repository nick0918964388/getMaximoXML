'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ReleaseNotesButton } from '@/components/release-notes-dialog';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function GlobalHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center gap-2">
        {user && (
          <>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
        <ReleaseNotesButton isAdmin={true} />
      </div>
    </header>
  );
}
