import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

// Better Auth — email/password, HR-provisioned accounts (no public
// self-registration in the UI; `disableSignUp` enforced server-side).
// Prisma adapter targets Neon Postgres via lib/db.ts.
export const auth = betterAuth({
  database: prismaAdapter(prisma as never, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 8, // 8h
    updateAge: 60 * 15,
  },
  user: {
    additionalFields: {
      // Privilege fields are NEVER client-writable: `input: false` makes
      // Better Auth reject them in update-user payloads (ADV-001).
      role: { type: "string", defaultValue: "EMPLOYEE", input: false },
      employeeId: { type: "string", required: false, input: false },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3100",
  ],
});

export type Session = typeof auth.$Infer.Session;
