/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';

let nextResult: { data: any; error: { message: string } | null } = { data: null, error: null };

export function __setResult(data: any, error?: string) {
  nextResult = { data, error: error ? { message: error } : null };
}

export function __resetMock() {
  nextResult = { data: null, error: null };
}

const resolve = () => Promise.resolve(nextResult);

const builder: any = {
  select: vi.fn().mockImplementation(function(this: any) { return this; }),
  insert: vi.fn().mockImplementation(function(this: any) { return this; }),
  update: vi.fn().mockImplementation(function(this: any) { return this; }),
  upsert: vi.fn().mockImplementation(function(this: any) { return this; }),
  delete: vi.fn().mockImplementation(function(this: any) { return this; }),
  eq: vi.fn().mockImplementation(function(this: any) { return this; }),
  order: vi.fn().mockImplementation(function(this: any) { return this; }),
  limit: vi.fn().mockImplementation(function(this: any) { return this; }),
  single: vi.fn().mockImplementation(resolve),
  maybeSingle: vi.fn().mockImplementation(resolve),
  then: (onfulfilled?: any, onrejected?: any) => resolve().then(onfulfilled, onrejected),
};

// Fix: return builder from chainable fns
for (const key of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order', 'limit'] as const) {
  builder[key] = vi.fn().mockReturnValue(builder);
}
builder.single = vi.fn().mockImplementation(resolve);
builder.maybeSingle = vi.fn().mockImplementation(resolve);

export const __builder = builder;

export const supabase = {
  from: vi.fn().mockReturnValue(builder),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
};

export function __resetAllMocks() {
  nextResult = { data: null, error: null };
  vi.clearAllMocks();
  // Rebind after clear
  for (const key of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order', 'limit'] as const) {
    builder[key] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockImplementation(resolve);
  builder.maybeSingle = vi.fn().mockImplementation(resolve);
  supabase.from = vi.fn().mockReturnValue(builder);
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
}
