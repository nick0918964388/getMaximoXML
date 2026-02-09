import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FmbConverterPage from '../page';

vi.mock('@/lib/supabase/client');

vi.mock('@/lib/supabase/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@test.com' },
    session: {},
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/fmb/parser', () => ({
  parseFmbXml: vi.fn(() => ({
    name: 'TEST',
    title: 'Test',
    blocks: [],
    canvases: [],
    lovs: [],
    triggers: [],
    attributes: {},
  })),
}));

vi.mock('@/lib/fmb/history', () => ({
  getUploadHistory: vi.fn(async () => []),
  addUploadHistory: vi.fn(async () => null),
  deleteUploadHistory: vi.fn(async () => true),
  clearUploadHistory: vi.fn(async () => true),
}));

describe('FmbConverterPage', () => {
  it('does not show loading spinner initially', () => {
    render(<FmbConverterPage />);
    expect(screen.queryByText(/解析中/)).not.toBeInTheDocument();
  });
});
