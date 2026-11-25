#!/usr/bin/env bun
/**
 * Dev-only UI probe: navigate, run a JS snippet (e.g. click a button), screenshot.
 * Usage: bun scripts/probe.ts <url> <out.png> <cookie> <width> <height> <jsExpression>
 */
export {};

const [url, out, cookie, w = "1440", h = "1000", expression = ""] = process.argv.slice(2);

const { spawn } = await import("node:child_process");
const { writeFile } = await import("node:fs/promises");

const brave = spawn(
  "/opt/brave.com/brave/brave",
  [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    "--remote-debugging-port=9334", `--window-size=${w},${h}`,
    `--user-data-dir=/tmp/brave-probe-${Date.now()}`, "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

try {
  let wsUrl: string | null = null;
  for (let i = 0; i < 40 && !wsUrl; i++) {
    await sleep(250);
    try {
      const res = await fetch("http://127.0.0.1:9334/json/list");
      const tabs = (await res.json()) as Array<{ type: string; webSocketDebuggerUrl: string }>;
      wsUrl = tabs.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null;
    } catch {}
  }
  if (!wsUrl) throw new Error("DevTools endpoint did not start");

  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map<number, (v: unknown) => void>();
  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<unknown>((resolve) => {
      const msgId = ++id;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("ws error"));
  });
  ws.onmessage = (event) => {
    const msg = JSON.parse(String(event.data)) as { id?: number; result?: unknown };
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)!(msg.result);
      pending.delete(msg.id);
    }
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: Number(w), height: Number(h), deviceScaleFactor: 1, mobile: Number(w) < 500,
  });
  if (cookie) {
    await send("Network.setCookie", {
      name: "better-auth.session_token", value: cookie, domain: "localhost", path: "/", httpOnly: false,
    });
  }
  await send("Page.navigate", { url });
  await sleep(4500);

  if (expression) {
    const result = (await send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    })) as { result?: { value?: unknown }; exceptionDetails?: unknown };
    if (result.exceptionDetails) console.error("probe error:", JSON.stringify(result.exceptionDetails));
    else console.log("probe:", JSON.stringify(result.result?.value ?? null));
    await sleep(2200);
  }

  const shot = (await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })) as { data: string };
  await writeFile(out, Buffer.from(shot.data, "base64"));
  console.log("saved", out);
} finally {
  brave.kill("SIGKILL");
}
