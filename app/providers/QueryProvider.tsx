"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * Provides a stable React Query client for the app subtree.
 * The client must be created only once per mounted provider so cache state survives re-renders.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Creating the client inside `useState` avoids rebuilding the cache on every render.
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}
