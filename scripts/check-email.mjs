/**
 * Mailgun delivery check.
 *
 *   npm run check:email -- you@example.com
 *
 * Sends a real message and reports what will ACTUALLY happen for that address.
 * The point is that a Mailgun sandbox domain answers HTTP 200 for every
 * recipient and then silently discards the ones it is not allowed to send, so a
 * green "200 OK" from the API is not proof that anybody received anything.
 *
 * Plain JavaScript on purpose: this runs under `node`, outside the Next.js
 * build, and must not be bundled into the app.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local before reading anything from process.env.
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim().replace(/^["'](.*)["']$/, "$1");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

const to = process.argv[2];
const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const from = process.env.MAILGUN_FROM || `Sonora Store <orders@${domain}>`;

const d = (domain || "").toLowerCase();
const override = process.env.MAILGUN_SANDBOX_LIMITS;
const sandboxed =
  override === "true" ||
  (override !== "false" && (d.includes("sandbox") || d.endsWith(".mailgun.org")));

const line = "─".repeat(64);
const fail = (message) => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

console.log(line);
console.log("Mailgun delivery check");
console.log(line);
console.log(`Domain : ${domain || "(not set)"}`);
console.log(`From   : ${from}`);
console.log(
  `Sandbox: ${sandboxed ? "YES - restricted to authorised recipients" : "no - can deliver to anyone"}`,
);

if (!to) fail("Usage: npm run check:email -- you@example.com");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to))
  fail(`"${to}" is not a valid email address.`);
if (!apiKey) fail("MAILGUN_API_KEY is not set in .env.local.");
if (!domain) fail("MAILGUN_DOMAIN is not set in .env.local.");

console.log(`To     : ${to}`);

// The From address must sit on the sending domain or Mailgun rejects the send.
const fromAddress = (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();
if (!fromAddress.endsWith(`@${d}`)) {
  console.warn(
    `\n! MAILGUN_FROM (${fromAddress}) is not on ${domain}. Mailgun will reject this.`,
  );
}

let payload;
try {
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      from,
      to,
      subject: "Sonora - email delivery test",
      text: "This is a test of your store's order confirmation email delivery. If you are reading this, delivery works for your address.",
    }),
  });

  payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`\n✗ Mailgun rejected the message (HTTP ${res.status})`);
    console.error(`  ${payload?.message ?? "No message returned."}`);
    if (res.status === 401) {
      console.error("  -> The API key is wrong. Check MAILGUN_API_KEY.");
    } else if (res.status === 400) {
      console.error(
        "  -> Check MAILGUN_DOMAIN / MAILGUN_FROM, and that the domain shows 'Active'.",
      );
    }
    process.exit(1);
  }
} catch (err) {
  fail(`Could not reach Mailgun: ${err.message}`);
}

console.log(`\n✓ Mailgun accepted the message (id: ${payload?.id})`);
console.log(line);

if (sandboxed) {
  console.log(
    [
      "",
      "⚠ SANDBOX DOMAIN - this message only arrives if:",
      "",
      `  1. ${to} is listed in Mailgun -> Sending -> Sandbox domain`,
      "     -> Authorized recipients, AND",
      "  2. that address is VERIFIED (Mailgun sends a verification link).",
      "",
      "  The API returned 200 either way, so the 200 above is NOT proof of",
      "  delivery. Check the inbox (and spam) in about a minute.",
      "",
      "  To email real customers, verify your own domain instead:",
      "    1. Mailgun -> Sending -> Domains -> Add domain",
      "    2. Add the DNS records it gives you and wait for 'Active'",
      "    3. Set the two variables below and restart the app",
      "",
      `       MAILGUN_DOMAIN=<your domain>`,
      `       MAILGUN_FROM="Sonora Store <orders@<your domain>>"`,
      "",
      "  Then re-run: npm run check:email -- some.other.address@gmail.com",
      "",
    ].join("\n"),
  );
} else {
  console.log(
    "\n✓ Real verified domain - this message is being delivered for real.\n",
  );
}