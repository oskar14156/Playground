/**
 * Public teaching example: preview a three-product price change.
 * Completely independent of any private application or store credentials.
 * No network calls, store writes, or filesystem writes.
 */
export const PRODUCTS = Object.freeze(["weekly", "yearly", "lifetime"]);
export const STORES = Object.freeze(["apple", "google"]);

const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function parsePriceCents(value) {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/.test(value)) {
    throw new TypeError("Prices must be positive decimal strings with up to two fractional digits");
  }
  const [units, fraction = ""] = value.split(".");
  const cents = Number(units) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new RangeError("The price must be positive and fit in a safe integer");
  }
  return cents;
}

function uniqueSelection(values, label) {
  if (!Array.isArray(values) || values.length === 0 || new Set(values).size !== values.length) {
    throw new TypeError(label + " must be a non-empty array without duplicates");
  }
}

/**
 * Returns a proposed snapshot; it never sends prices to Apple or Google.
 * All requested store/region/sku combinations are validated before return.
 * The input catalog is never mutated, even when validation fails.
 */
export function createPricePreview({ catalog, stores, regions, prices }) {
  uniqueSelection(stores, "stores");
  uniqueSelection(regions, "regions");
  if (stores.some((store) => !STORES.includes(store))) {
    throw new TypeError("Unknown store");
  }
  if (regions.some((region) => typeof region !== "string" || !/^[A-Z]{2}$/.test(region))) {
    throw new TypeError("Regions must be two-letter uppercase codes");
  }
  if (!prices || typeof prices !== "object" || Array.isArray(prices) ||
      Object.keys(prices).length !== PRODUCTS.length ||
      PRODUCTS.some((product) => !owns(prices, product))) {
    throw new TypeError("Specify exactly weekly, yearly, and lifetime prices");
  }
  const nextPrices = Object.fromEntries(PRODUCTS.map((p) => [p, parsePriceCents(prices[p])]));
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    throw new TypeError("Catalog must be an object");
  }
  const nextCatalog = structuredClone(catalog);
  const changes = [];
  for (const store of stores) {
    for (const region of regions) {
      const existing = catalog[store]?.[region];
      if (!existing || typeof existing !== "object" ||
          PRODUCTS.some((product) => !Number.isSafeInteger(existing[product]) || existing[product] < 0)) {
        throw new TypeError("Catalog is missing a valid store/region/sku price");
      }
      for (const product of PRODUCTS) {
        changes.push({
          store,
          region,
          product,
          fromCents: existing[product],
          toCents: nextPrices[product],
        });
        nextCatalog[store][region][product] = nextPrices[product];
      }
    }
  }
  return { previewOnly: true, nextCatalog, changes };
}
