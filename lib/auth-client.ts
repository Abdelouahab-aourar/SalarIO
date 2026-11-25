"use client";

import { createAuthClient } from "better-auth/react";

// Derive the auth base URL from the actual origin so the app works on any
// port/host (3000, 3100, preview URLs) without env drift.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({ baseURL });
