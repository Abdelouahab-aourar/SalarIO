/**
 * Server instrumentation — database keepalive.
 *
 * The trial Neon compute scales to zero when idle; the first request after
 * a pause can fail while it wakes (and reconnects are flaky on this
 * network). A lightweight `SELECT 1` every 45s keeps one pooled connection
 * and the compute warm so page loads and sign-in respond immediately.
 *
 * Runs only on the Node.js server runtime (long-lived server), never during
 * the build, and never throws into request handling.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) return;

  const { prisma } = await import("@/lib/db");
  if (!prisma) return;

  const tick = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // Transient network/wake failure — the next tick retries.
    }
  };

  // Warm up before serving so the first request after a cold start succeeds.
  await tick();
  const timer = setInterval(() => void tick(), 45_000);
  // Never keep the process alive solely for the keepalive.
  timer.unref?.();
}
