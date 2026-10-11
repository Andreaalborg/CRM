// Fase 4-pilot: oppretter eller sletter tydelig merkede testdata («Demo Kunde (TEST – pilot)»).
// Kjøres i prod-build bare når PILOT_SEED=create|delete er satt. Gjør ingenting ellers.
// PILOT_TOKEN_HASH (valgfri) = sha256("login:"+token) for en engangslenke (tokenet selv finnes ikke i env).
import { randomUUID } from "node:crypto";
import pg from "pg";

const mode = process.env.PILOT_SEED;
const url = process.env.NEON_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const ORGS = [
  { slug: "demo-kunde-pilot", name: "Demo Kunde (TEST – pilot)", email: "demo.kunde@pilot-test.invalid", user: "Demo Testbruker" },
  ...(process.env.PILOT_SECOND === "1" ? [{ slug: "annen-kunde-test", name: "Annen Kunde (TEST)", email: "annen.kunde@pilot-test.invalid", user: "Annen Testbruker" }] : []),
];
if (!url || !["create", "delete"].includes(mode || "")) { console.log("[pilot-seed] ingenting å gjøre"); process.exit(0); }
const c = new pg.Client({ connectionString: url });
await c.connect();
const now = "now() at time zone 'utc'";
try {
  if (mode === "delete") {
    for (const o of [...ORGS, { slug: "annen-kunde-test" }]) {
      const org = (await c.query(`SELECT id FROM "Organization" WHERE slug=$1`, [o.slug])).rows[0];
      if (!org) continue;
      await c.query(`DELETE FROM "LoginToken" WHERE "userId" IN (SELECT id FROM "User" WHERE "organizationId"=$1)`, [org.id]);
      await c.query(`DELETE FROM "ActivityLog" WHERE "userId" IN (SELECT id FROM "User" WHERE "organizationId"=$1)`, [org.id]);
      await c.query(`DELETE FROM "Organization" WHERE id=$1`, [org.id]); // cascade: brukere, skjemaer, innsendinger
      console.log(`[pilot-seed] slettet ${o.slug}`);
    }
  } else {
    for (const [i, o] of ORGS.entries()) {
      let org = (await c.query(`SELECT id FROM "Organization" WHERE slug=$1`, [o.slug])).rows[0];
      if (!org) {
        org = { id: randomUUID() };
        await c.query(`INSERT INTO "Organization"(id,name,slug,notes,"createdAt","updatedAt") VALUES ($1,$2,$3,'TESTDATA fase 4-pilot – kan slettes',${now},${now})`, [org.id, o.name, o.slug]);
        const form = randomUUID();
        await c.query(`INSERT INTO "Form"(id,name,slug,status,"organizationId","createdAt","updatedAt") VALUES ($1,'Kontaktskjema (TEST)','kontakt-test','PUBLISHED',$2,${now},${now})`, [form, org.id]);
        const people = i === 0
          ? [["Kari Nordmann", "kari@eksempel.no", "+47 900 00 001", "Hei! Vi trenger hjelp med en ny nettside til frisørsalongen."], ["Ola Hansen", "ola@eksempel.no", "+47 900 00 002", "Kan dere ringe meg om pris på SEO?"], ["Fjord Bygg AS", "post@fjordbygg.example", "+47 900 00 003", "Ønsker tilbud på vedlikeholdsavtale."], ["Siri Lunde", "siri@eksempel.no", "", "Hvor raskt kan dere levere?"], ["Per Berg", "per@eksempel.no", "+47 900 00 005", "Takk for sist – her er info om oss."], ["Anne Dahl", "anne@eksempel.no", "+47 900 00 006", "Spørsmål om faktura."]]
          : [["HEMMELIG Annen", "hemmelig@annen.example", "+47 911 11 111", "Denne skal Demo Kunde ALDRI se."]];
        for (const [j, p] of people.entries()) {
          await c.query(`INSERT INTO "Submission"(id,"formId","organizationId",data,status,"handledAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,${now} - ($7 || ' days')::interval,${now})`,
            [randomUUID(), form, org.id, JSON.stringify({ navn: p[0], epost: p[1], telefon: p[2], melding: p[3] }), j >= 4 ? "CONTACTED" : "NEW", j >= 4 ? new Date() : null, String(j * 3)]);
        }
        await c.query(`INSERT INTO "User"(id,email,name,role,"organizationId","createdAt","updatedAt") VALUES ($1,$2,$3,'CUSTOMER',$4,${now},${now}) ON CONFLICT (email) DO NOTHING`, [randomUUID(), o.email, o.user, org.id]);
        console.log(`[pilot-seed] opprettet ${o.slug}`);
      }
      if (i === 0 && /^[0-9a-f]{64}$/.test(process.env.PILOT_TOKEN_HASH || "")) {
        const u = (await c.query(`SELECT id FROM "User" WHERE email=$1`, [o.email])).rows[0];
        await c.query(`INSERT INTO "LoginToken"(id,"tokenHash","userId","expiresAt","createdAt") VALUES ($1,$2,$3,${now} + interval '24 hours',${now}) ON CONFLICT ("tokenHash") DO NOTHING`, [randomUUID(), process.env.PILOT_TOKEN_HASH, u.id]);
        console.log("[pilot-seed] engangslenke-hash lagt inn");
      }
    }
  }
} finally { await c.end(); }
