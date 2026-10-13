import test from "node:test";
import assert from "node:assert/strict";
import { createPricePreview, parsePriceCents } from "../src/pricing-plan.mjs";

const catalog = () => ({
  apple: {
    AT: { weekly: 399, yearly: 2999, lifetime: 5999 },
    DE: { weekly: 499, yearly: 3999, lifetime: 6999 },
  },
  google: {
    AT: { weekly: 399, yearly: 2999, lifetime: 5999 },
    DE: { weekly: 499, yearly: 3999, lifetime: 6999 },
  },
});
const prices = () => ({ weekly: "4.49", yearly: "34.99", lifetime: "69.99" });
const preview = (overrides = {}) =>
  createPricePreview({ catalog: catalog(), stores: ["apple"], regions: ["AT"], prices: prices(), ...overrides });

test("01: converts decimal price strings into integer cents", () => {
  assert.equal(parsePriceCents("3.99"), 399);
  assert.equal(parsePriceCents("9.5"), 950);
  assert.equal(parsePriceCents("10"), 1000);
});

test("02: rejects malformed and overprecise money input", () => {
  for (const value of ["4,99", "$3.00", "1.999", " 1.00", "01.00", "abc"]) {
    assert.throws(() => parsePriceCents(value), TypeError);
  }
});

test("03: rejects zero, negative, and unsafe price amounts", () => {
  assert.throws(() => parsePriceCents("0.00"), RangeError);
  assert.throws(() => parsePriceCents("-1"), TypeError);
  assert.throws(() => parsePriceCents("999999999999999"), RangeError);
});

test("04: requires all three subscription/one-time product prices", () => {
  const next = prices();
  delete next.lifetime;
  assert.throws(() => preview({ prices: next }), /exactly weekly, yearly, and lifetime/);
});

test("05: rejects unexpected product identifiers", () => {
  assert.throws(() => preview({ prices: { ...prices(), lifetime2: "80" } }), /exactly weekly/);
});

test("06: changes weekly, yearly, and lifetime together in a single preview", () => {
  const result = preview();
  assert.equal(result.previewOnly, true);
  assert.equal(result.changes.length, 3);
  assert.deepEqual(result.nextCatalog.apple.AT, { weekly: 449, yearly: 3499, lifetime: 6999 });
});

test("07: handles both stores in the same price-change batch", () => {
  const result = preview({ stores: ["apple", "google"] });
  assert.equal(result.changes.length, 6);
  assert.deepEqual(result.nextCatalog.apple.AT, result.nextCatalog.google.AT);
});

test("08: preserves regions that were not selected", () => {
  const result = preview({ stores: ["apple", "google"], regions: ["AT"] });
  assert.deepEqual(result.nextCatalog.apple.DE, catalog().apple.DE);
  assert.deepEqual(result.nextCatalog.google.DE, catalog().google.DE);
});

test("09: rejects an unavailable target atomically without mutating the source", () => {
  const source = catalog();
  const original = structuredClone(source);
  assert.throws(() => preview({ catalog: source, regions: ["AT", "FR"] }), /missing a valid/);
  assert.deepEqual(source, original);
});

test("10: rejects duplicate or invalid selections", () => {
  assert.throws(() => preview({ stores: ["apple", "apple"] }), /duplicates/);
  assert.throws(() => preview({ regions: ["at"] }), /uppercase/);
  assert.throws(() => preview({ stores: ["other"] }), /Unknown store/);
});
