import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  recipientBlockers, isAsOrAsa, merge, unresolved, nextAction, suppressionHash, healthFromParts, footer, svakhetTekst, WEEKLY_CAP,
} from "./outreach-core";

const ok = { epost: "post@firma.no", orgform: "AS", suppressed: false, steg: 0, newContactsLast7d: 0 };

test("v2-filter: generisk adresse hos AS/ASA slipper gjennom", () => {
  assert.deepEqual(recipientBlockers(ok), []);
  assert.deepEqual(recipientBlockers({ ...ok, orgform: "ASA", epost: "firmapost@x.no" }), []);
  assert.ok(isAsOrAsa("Aksjeselskap"));
});
test("v2-filter: ENK blokkeres, også med generisk adresse", () => {
  const r = recipientBlockers({ ...ok, orgform: "ENK" });
  assert.equal(r.length, 1); assert.match(r[0], /ENK/);
});
test("v2-filter: personlig/navngitt adresse blokkeres", () => {
  assert.match(recipientBlockers({ ...ok, epost: "ola.nordmann@firma.no" })[0], /generisk/);
  assert.match(recipientBlockers({ ...ok, epost: "kari@firma.no" })[0], /generisk/);
});
test("v2-filter: ukjent orgform, ANS og NUF blokkeres; mangler e-post blokkeres", () => {
  for (const o of [null, "ANS", "NUF", "DA"]) assert.ok(recipientBlockers({ ...ok, orgform: o }).some((x) => /AS\/ASA/.test(x)), String(o));
  assert.ok(recipientBlockers({ ...ok, epost: null }).some((x) => /Mangler/.test(x)));
});
test("sperreliste blokkerer", () => {
  assert.ok(recipientBlockers({ ...ok, suppressed: true }).some((x) => /sperrelisten/.test(x)));
});
test("ukegrense: maks 20 NYE kontakter per 7 dager (gjelder bare dag 0)", () => {
  assert.equal(WEEKLY_CAP, 20);
  assert.deepEqual(recipientBlockers({ ...ok, newContactsLast7d: 19 }), []);
  assert.match(recipientBlockers({ ...ok, newContactsLast7d: 20 })[0], /Ukegrensen/);
  assert.deepEqual(recipientBlockers({ ...ok, steg: 1, newContactsLast7d: 50 }), [], "oppfølging av eksisterende kontakt teller ikke");
});
test("flettefelt {firma} {kontakt} {demo_url} {svakhet}; tomme felt blir stående og blokkerer", () => {
  const t = merge("Hei {kontakt}, {firma}: {svakhet} {demo_url}", { firma: "Rør AS", kontakt: null, demo_url: "https://d/x", svakhet: "– treg" });
  assert.equal(t, "Hei dere, Rør AS: – treg https://d/x");
  const u = merge("{firma} {demo_url}", { firma: "X", demo_url: "" });
  assert.deepEqual(unresolved(u), ["demo_url"]);
  assert.equal(svakhetTekst("a\nb\nc\nd"), "– a\n– b\n– c");
});
test("sperreliste lagrer bare hash, normalisert", () => {
  assert.equal(suppressionHash("epost", " Post@Firma.no "), suppressionHash("epost", "post@firma.no"));
  assert.match(suppressionHash("orgnr", "999 999 999"), /^[0-9a-f]{64}$/);
  assert.notEqual(suppressionHash("epost", "a@b.no"), suppressionHash("orgnr", "a@b.no"));
});
test("hver e-post har avmeldingslenke, avsender og art. 14", () => {
  const f = footer("https://crm.intellisenseai.no/avmeld/TOKEN", "kilde");
  assert.match(f, /avmeld\/TOKEN/); assert.match(f, /IntelliSense/); assert.match(f, /personvern/); assert.match(f, /markedsføring/);
});

const D = 86_400_000, t0 = new Date("2026-10-01T09:00:00Z");
test("sekvens: dag 0 lages ved Godkjent, dag 4 og 10 etter dag-0-sendingen, Pause etter dag 10 + 7", () => {
  assert.deepEqual(nextAction({ stage: "GODKJENT", suppressed: false, drafts: [] }, t0), { kind: "create", steg: 0, planlagtFor: t0 });
  const s0 = [{ steg: 0, status: "SENDT", sendtDato: t0 }];
  assert.equal(nextAction({ stage: "KONTAKTET", suppressed: false, drafts: s0 }, new Date(t0.getTime() + 3 * D)).kind, "none");
  const a4 = nextAction({ stage: "KONTAKTET", suppressed: false, drafts: s0 }, new Date(t0.getTime() + 4 * D));
  assert.equal(a4.kind, "create"); assert.equal((a4 as { steg: number }).steg, 1);
  const s1 = [...s0, { steg: 1, status: "SENDT", sendtDato: new Date(t0.getTime() + 4 * D) }];
  assert.equal(nextAction({ stage: "KONTAKTET", suppressed: false, drafts: s1 }, new Date(t0.getTime() + 9 * D)).kind, "none");
  assert.equal((nextAction({ stage: "KONTAKTET", suppressed: false, drafts: s1 }, new Date(t0.getTime() + 10 * D)) as { steg: number }).steg, 2);
  const s2 = [...s1, { steg: 2, status: "SENDT", sendtDato: new Date(t0.getTime() + 10 * D) }];
  assert.equal(nextAction({ stage: "KONTAKTET", suppressed: false, drafts: s2 }, new Date(t0.getTime() + 16 * D)).kind, "none");
  assert.equal(nextAction({ stage: "KONTAKTET", suppressed: false, drafts: s2 }, new Date(t0.getTime() + 17 * D)).kind, "pause");
});
test("svar/stage-endring og avmelding stopper ventende utkast", () => {
  const p = [{ steg: 0, status: "SENDT", sendtDato: t0 }, { steg: 1, status: "UTKAST", sendtDato: null }];
  assert.equal(nextAction({ stage: "SVART", suppressed: false, drafts: p }, t0).kind, "stop");
  assert.equal(nextAction({ stage: "KONTAKTET", suppressed: true, drafts: p }, t0).kind, "stop");
  assert.equal(nextAction({ stage: "SVART", suppressed: false, drafts: [{ steg: 0, status: "SENDT", sendtDato: t0 }] }, new Date(t0.getTime() + 20 * D)).kind, "none");
});
test("helsesjekk: Send er av til EMAIL_FROM er verifisert intellisenseai.no", () => {
  assert.equal(healthFromParts({ emailFrom: "noreply@kundedata.no", apiKey: true, domainStatus: null }).ok, false);
  assert.equal(healthFromParts({ emailFrom: "André <andre@intellisenseai.no>", apiKey: true, domainStatus: "pending" }).ok, false);
  assert.equal(healthFromParts({ emailFrom: "André <andre@intellisenseai.no>", apiKey: false, domainStatus: null }).ok, false);
  assert.equal(healthFromParts({ emailFrom: "André <andre@intellisenseai.no>", apiKey: true, domainStatus: "verified" }).ok, true);
});
test("cron-veien kan ikke sende: cron-ruten og outreach.ts importerer verken mailer, Resend eller @/lib/email", () => {
  for (const f of ["src/app/api/cron/fase3/route.ts", "src/lib/crm/outreach.ts", "src/lib/crm/outreach-core.ts", "src/lib/crm/maler.ts"]) {
    const src = readFileSync(f, "utf8").split("\n").filter((l) => /^\s*import|from\s+["']/.test(l)).join("\n");
    assert.doesNotMatch(src, /mailer|resend|@\/lib\/email|outreach-actions/i, f);
  }
  // og mailer importeres bare av outreach-actions (Andrés klikk) og I dag-siden (kun emailHealth)
  const uses = ["src/lib/crm/outreach-actions.ts"];
  assert.match(readFileSync(uses[0], "utf8"), /from "\.\/mailer"/);
});
