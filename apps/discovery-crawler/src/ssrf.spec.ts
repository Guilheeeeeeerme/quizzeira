import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeFetchUrl, isBlockedIp } from "./ssrf.js";

test("isBlockedIp covers loopback and RFC1918", () => {
  assert.equal(isBlockedIp("127.0.0.1"), true);
  assert.equal(isBlockedIp("10.0.0.5"), true);
  assert.equal(isBlockedIp("192.168.1.1"), true);
  assert.equal(isBlockedIp("172.16.0.1"), true);
  assert.equal(isBlockedIp("169.254.169.254"), true);
  assert.equal(isBlockedIp("8.8.8.8"), false);
  assert.equal(isBlockedIp("1.1.1.1"), false);
});

test("assertSafeFetchUrl rejects unsafe schemes and hosts", () => {
  assert.throws(() => assertSafeFetchUrl("file:///etc/passwd"), /ssrf_blocked:scheme/);
  assert.throws(() => assertSafeFetchUrl("http://localhost/x"), /ssrf_blocked:hostname/);
  assert.throws(() => assertSafeFetchUrl("http://127.0.0.1/x"), /ssrf_blocked:ip/);
  assert.throws(() => assertSafeFetchUrl("http://169.254.169.254/latest"), /ssrf_blocked:ip/);
  const ok = assertSafeFetchUrl("https://example.com/edital.pdf");
  assert.equal(ok.hostname, "example.com");
});
