import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STAGES, adjacentStage, validateStageChange, probabilityAfterMove, expectedValue,
  normalizeOrgnr, isValidOrgnr, dueState, osloDayBounds, nextPosition, isStage,
} from "./core";

test("pipeline har stegene André godkjente, i rekkefølge", () => {
  assert.deepEqual([...STAGES], ["KVALIFISERT","GODKJENT","KONTAKTET","SVART","MOTE","TILBUD","VUNNET","TAPT","PAUSE"]);
});

test("tastaturflytt: forrige/neste og kanter", () => {
  assert.equal(adjacentStage("KVALIFISERT", 1), "GODKJENT");
  assert.equal(adjacentStage("KVALIFISERT", -1), null);
  assert.equal(adjacentStage("PAUSE", 1), null);
  assert.equal(adjacentStage("TILBUD", 1), "VUNNET");
});

test("Tapt krever årsak, Pause krever dato", () => {
  assert.match(validateStageChange("TAPT", {})!, /tapsårsak/);
  assert.equal(validateStageChange("TAPT", { tapsarsak: "Pris" }), null);
  assert.match(validateStageChange("PAUSE", {})!, /dato/);
  assert.equal(validateStageChange("PAUSE", { nesteStegDato: new Date() }), null);
  assert.equal(validateStageChange("MOTE", {}), null);
});

test("sannsynlighet etter flytt", () => {
  assert.equal(probabilityAfterMove("TILBUD", 10, "stage-default"), 70);
  assert.equal(probabilityAfterMove("TILBUD", 42, "manuell"), 42);
  assert.equal(probabilityAfterMove("VUNNET", 42, "manuell"), 100);
  assert.equal(probabilityAfterMove("TAPT", 42, "leadhunter"), 0);
});

test("forventet verdi", () => {
  assert.equal(expectedValue(50, 40000), 20000);
  assert.equal(expectedValue(150, 1000), 1000);
  assert.equal(expectedValue(30, null), 0);
});

test("orgnr normaliseres og valideres (mod 11)", () => {
  assert.equal(normalizeOrgnr(" 923 609 016 "), "923609016");
  assert.equal(normalizeOrgnr("NO 923.609.016 MVA"), "923609016");
  assert.equal(normalizeOrgnr(""), null);
  assert.equal(isValidOrgnr("923609016"), true); // Equinor
  assert.equal(isValidOrgnr("923609017"), false);
  assert.equal(isValidOrgnr("12345"), false);
});

test("forfall i Oslo-tid", () => {
  const now = new Date("2026-10-11T15:00:00Z"); // 17:00 Oslo
  const { start, end } = osloDayBounds(now);
  assert.equal(start.toISOString(), "2026-10-10T22:00:00.000Z");
  assert.equal(end.toISOString(), "2026-10-11T22:00:00.000Z");
  assert.equal(dueState(new Date("2026-10-10T21:59:00Z"), now), "forfalt");
  assert.equal(dueState(new Date("2026-10-11T21:30:00Z"), now), "i-dag");
  assert.equal(dueState(new Date("2026-10-12T08:00:00Z"), now), "senere");
  assert.equal(dueState(null, now), "ingen");
  // vintertid
  assert.equal(osloDayBounds(new Date("2026-12-01T12:00:00Z")).start.toISOString(), "2026-11-30T23:00:00.000Z");
});

test("posisjon og typevakt", () => {
  assert.equal(nextPosition([]), 0);
  assert.equal(nextPosition([0, 4, 2]), 5);
  assert.equal(isStage("MOTE"), true);
  assert.equal(isStage("NY"), false);
});
