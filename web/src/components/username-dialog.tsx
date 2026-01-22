'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UsernameDialogProps {
  open: boolean;
  onSubmit: (username: string) => void;
  currentUsername?: string | null;
}

export function UsernameDialog({ open, onSubmit, currentUsername }: UsernameDialogProps) {
  const [username, setUsername] = useState(currentUsername || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (trimmedUsername.length > 50) {
      setError('Username must be less than 50 characters');
      return;
    }

    // Only allow alphanumeric, underscore, and hyphen
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setError('');
    onSubmit(trimmedUsername);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {currentUsername ? 'Switch User' : 'Welcome'}
          </DialogTitle>
          <DialogDescription>
            {currentUsername
              ? 'Enter a different username to switch accounts. Each user has their own projects.'
              : 'Please enter your username to get started. Your projects will be saved under this name.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <div className="col-span-3">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your username"
                  autoFocus
                  autoComplete="off"
                />
                {error && (
                  <p className="text-sm text-destructive mt-1">{error}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">
              {currentUsername ? 'Switch User' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
