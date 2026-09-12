import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateJaccard, exactJaccard, lshBandKeys, minhashSignature, shingleSet, signatureFromBase64, signatureToBase64 } from "./minhash";
import { hammingDistance, isNearDuplicateSimhash, simhash64, simhashFromSigned, simhashToSigned } from "./simhash";
import { fnv1a64, foldAccents, normalizeForKey, shingles, tokenize } from "./text-normalize";

const NOUNS = ["verbo", "sujeito", "predicado", "objeto", "adjunto", "aposto", "vocativo", "complemento", "pronome", "artigo"];
const VERBS = ["concorda", "rege", "modifica", "acompanha", "determina", "qualifica", "substitui", "introduz"];
// Digits are normalised to 0 by the dedup keys, so the fixture varies words, not numbers.
const BASE = NOUNS.flatMap((n) => VERBS.map((v) => `O ${n} ${v} o termo seguinte segundo a norma-padrão da língua.`)).join(" ");
const NEAR = BASE.replace("O verbo concorda", "O verbo sempre concorda").replace("O artigo rege", "O artigo nunca rege");
const OTHER = NOUNS.flatMap((n) => VERBS.map((v) => `A lei ${v} a modalidade ${n} aplicável às obras de engenharia de grande vulto.`)).join(" ");

describe("text normalisation keys (§26)", () => {
  it("normalises NFC, case, punctuation and digits per layer", () => {
    assert.equal(normalizeForKey("Página 12 — Edital nº 01/2026!", { digitsToZero: true }), "página 00 edital nº 00 0000");
    assert.equal(normalizeForKey("Página 12 — Edital nº 01/2026!"), "página 12 edital nº 01 2026");
    assert.equal(foldAccents("Concordância"), "Concordancia");
    assert.deepEqual(tokenize("Olá, mundo 2026"), ["olá", "mundo", "2026"]);
    assert.deepEqual(shingles(["a", "b", "c"], 5), ["a b c"]);
    assert.equal(shingles(["a", "b", "c", "d", "e", "f"], 5).length, 2);
    assert.equal(fnv1a64("abc"), fnv1a64("abc"));
    assert.notEqual(fnv1a64("abc"), fnv1a64("abd"));
  });
});

describe("simhash (document layer)", () => {
  it("near-duplicates are within Hamming 3, unrelated documents are far", () => {
    const a = simhash64(BASE);
    const b = simhash64(NEAR);
    const c = simhash64(OTHER);
    assert.equal(hammingDistance(a, a), 0);
    assert.ok(hammingDistance(a, b) <= 3, `near distance ${hammingDistance(a, b)}`);
    assert.ok(isNearDuplicateSimhash(a, b));
    assert.ok(hammingDistance(a, c) > 10, `far distance ${hammingDistance(a, c)}`);
    assert.equal(simhash64(""), 0n);
  });
  it("round-trips through Postgres signed BIGINT", () => {
    const v = (1n << 63n) + 12345n;
    const signed = simhashToSigned(v);
    assert.ok(signed < 0n);
    assert.equal(simhashFromSigned(signed), v);
    assert.equal(simhashFromSigned(simhashToSigned(42n)), 42n);
  });
});

describe("minhash (chunk layer)", () => {
  it("estimates Jaccard within ±0.05 and is stable across calls", () => {
    const sa = minhashSignature(BASE);
    const sb = minhashSignature(NEAR);
    const sc = minhashSignature(OTHER);
    const exactAB = exactJaccard(shingleSet(BASE), shingleSet(NEAR));
    assert.ok(Math.abs(estimateJaccard(sa, sb) - exactAB) <= 0.05, `est ${estimateJaccard(sa, sb)} exact ${exactAB}`);
    assert.ok(estimateJaccard(sa, sb) >= 0.85);
    assert.ok(estimateJaccard(sa, sc) < 0.1);
    assert.deepEqual(Array.from(minhashSignature(BASE)), Array.from(sa));
  });
  it("LSH bands share at least one key for near-duplicates and none for unrelated text", () => {
    const ka = new Set(lshBandKeys(minhashSignature(BASE)));
    const kb = lshBandKeys(minhashSignature(NEAR));
    const kc = lshBandKeys(minhashSignature(OTHER));
    assert.ok(kb.some((k) => ka.has(k)));
    assert.ok(!kc.some((k) => ka.has(k)));
  });
  it("serialises signatures losslessly", () => {
    const sig = minhashSignature(BASE);
    assert.deepEqual(Array.from(signatureFromBase64(signatureToBase64(sig))), Array.from(sig));
  });
});
