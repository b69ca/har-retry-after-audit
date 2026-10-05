import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, parseRetryAfter } from '../src/index.js';
const entry = (time, status, retryAfter) => ({ startedDateTime: time, request: { method: 'GET', url: 'https://api.test/jobs?token=secret' }, response: { status, headers: retryAfter == null ? [] : [{ name: 'Retry-After', value: retryAfter }] } });
test('parses delta seconds and HTTP dates', () => { assert.equal(parseRetryAfter('5', '2026-01-01T00:00:00Z'), 5000); assert.equal(parseRetryAfter('Thu, 01 Jan 2026 00:00:10 GMT', '2026-01-01T00:00:00Z'), 10000); });
test('finds missing headers', () => { const r = analyze({ log: { entries: [entry('2026-01-01T00:00:00Z', 429)] } }); assert.equal(r.findings[0].type, 'missing-retry-after'); });
test('finds an early retry', () => { const r = analyze({ log: { entries: [entry('2026-01-01T00:00:00Z', 429, '10'), entry('2026-01-01T00:00:02Z', 200)] } }); assert.equal(r.findings[0].type, 'retried-too-early'); });
test('does not expose query values', () => { const r = analyze({ log: { entries: [entry('2026-01-01T00:00:00Z', 503)] } }); assert.equal(JSON.stringify(r).includes('secret'), false); });
