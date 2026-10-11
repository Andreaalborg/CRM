import { test } from "node:test";
import assert from "node:assert/strict";
import { generateApiKey, hashApiKey, extractApiKey, hasScope, signBody, verifyInbound } from "./apikey";

test("nøkkel genereres unik og hashes deterministisk", () => {
  const a = generateApiKey(), b = generateApiKey();
  assert.notEqual(a, b);
  assert.match(a, /^isk_[A-Za-z0-9_-]{40,}$/);
  assert.equal(hashApiKey(a), hashApiKey(a));
  assert.equal(hashApiKey(a).length, 64);
});

test("nøkkel leses fra Bearer eller X-API-Key", () => {
  assert.equal(extractApiKey(new Headers({ authorization: "Bearer isk_x" })), "isk_x");
  assert.equal(extractApiKey(new Headers({ "x-api-key": "isk_y" })), "isk_y");
  assert.equal(extractApiKey(new Headers()), null);
});

test("scopes", () => {
  assert.equal(hasScope(["leads:read"], "leads:read"), true);
  assert.equal(hasScope(["leads:read"], "leads:write"), false);
});

test("signert webhook: gyldig, feil signatur, utløpt, statisk nøkkel", () => {
  const secret = "s".repeat(32), body = '{"a":1}', now = 1_800_000_000, ts = String(now);
  const good = new Headers({ "x-is-timestamp": ts, "x-is-signature": "sha256=" + signBody(secret, ts, body) });
  assert.deepEqual(verifyInbound(secret, good, body, now), { ok: true, method: "hmac" });
  assert.equal(verifyInbound(secret, good, body + " ", now).ok, false);
  assert.equal(verifyInbound(secret, good, body, now + 301).ok, false);
  assert.equal(verifyInbound(secret, new Headers({ "x-is-key": secret }), body, now).ok, true);
  assert.equal(verifyInbound(secret, new Headers({ "x-is-key": "feil" }), body, now).ok, false);
  assert.equal(verifyInbound(secret, new Headers(), body, now).ok, false);
  assert.equal(verifyInbound(undefined, good, body, now).ok, false);
});
