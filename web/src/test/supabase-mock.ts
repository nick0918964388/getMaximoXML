/**
 * Creates a mock Supabase builder for use inside vi.hoisted().
 * This function has NO external dependencies and can be copy-pasted
 * directly into vi.hoisted() callbacks.
 *
 * Since vi.hoisted() cannot import modules, we provide this as a
 * reference pattern. Each test file should inline the mock setup.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function createSupabaseMock() {
  let nextResult: { data: Any; error: { message: string } | null } = { data: null, error: null };

  const setResult = (data: Any, error?: string) => {
    nextResult = { data, error: error ? { message: error } : null };
  };

  const resolve = () => Promise.resolve(nextResult);

  const builder: Record<string, Any> = {};
  const chainMethods = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order', 'limit'];

  for (const key of chainMethods) {
    const calls: Any[][] = [];
    builder[key] = (...args: Any[]) => { calls.push(args); return builder; };
    builder[key]._calls = calls;
  }

  builder.single = () => resolve();
  builder.maybeSingle = () => resolve();
  builder.then = (onfulfilled?: Any, onrejected?: Any) => resolve().then(onfulfilled, onrejected);

  const fromCalls: string[] = [];
  const from = (table: string) => { fromCalls.push(table); return builder; };
  from._calls = fromCalls;

  const resetMocks = () => {
    nextResult = { data: null, error: null };
    for (const key of chainMethods) {
      builder[key]._calls.length = 0;
    }
    fromCalls.length = 0;
  };

  return { from, builder, setResult, resetMocks };
}
