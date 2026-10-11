// Kjøres i prod-build etter `prisma migrate deploy`. Oppretter/oppdaterer bot-nøkler fra miljøvariabler,
// slik at nøkkelen kan settes som sensitiv env i både CRM og lead-appen uten at den vises noe sted.
// Lagrer bare sha256-hash. En nøkkel som er tilbakekalt i UI forblir tilbakekalt til env-verdien byttes. Gjør ingenting hvis variablene mangler.
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";

const SEEDS = [
  { env: "SEED_BOT_KEY_LEADAPP", navn: "lead-app", scopes: ["leads:read", "leads:write", "activities:write"] },
];

const url = process.env.NEON_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const todo = SEEDS.filter((s) => (process.env[s.env] || "").length >= 32);
if (!url || !todo.length) {
  console.log("[seed-bot-keys] ingenting å gjøre");
  process.exit(0);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  for (const s of todo) {
    const key = process.env[s.env];
    const hash = createHash("sha256").update(key, "utf8").digest("hex");
    await client.query(
      `INSERT INTO "BotApiKey" (id, navn, prefix, hash, scopes, "createdAt") VALUES ($1, $2, $3, $4, $5, now() at time zone 'utc')
       ON CONFLICT (navn) DO UPDATE SET hash = EXCLUDED.hash, prefix = EXCLUDED.prefix, scopes = EXCLUDED.scopes, "revokedAt" = NULL
       WHERE "BotApiKey".hash <> EXCLUDED.hash`,
      [randomUUID(), s.navn, key.slice(0, 10), hash, s.scopes]
    );
    console.log(`[seed-bot-keys] ${s.navn} ok`);
  }
} finally {
  await client.end();
}
