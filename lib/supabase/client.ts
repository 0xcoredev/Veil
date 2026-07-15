"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-url")) {
    // Return a mock client that returns empty data
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signIn: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                range: () => Promise.resolve({ data: [], error: null }),
                then: (resolve: (r: unknown) => void) => resolve({ data: [], error: null }),
              }),
              single: () => Promise.resolve({ data: null, error: null }),
              then: (resolve: (r: unknown) => void) => resolve({ data: [], error: null }),
            }),
            single: () => Promise.resolve({ data: null, error: null }),
            is: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
            then: (resolve: (r: unknown) => void) => resolve({ data: [], error: null }),
          }),
          then: (resolve: (r: unknown) => void) => resolve({ data: [], error: null }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        upsert: () => Promise.resolve({ data: null, error: null }),
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => ({
            unsubscribe: () => {},
          }),
        }),
      }),
      realtime: { setAuth: () => {} },
    } as any;
  }

  client = createBrowserClient(url, key);
  return client;
}
