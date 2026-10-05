const header = (headers = [], name) => headers.find(x => String(x.name).toLowerCase() === name.toLowerCase())?.value;
const endpoint = value => { const u = new URL(value); return `${u.origin}${u.pathname}`; };
export function parseRetryAfter(value, responseTime) {
  if (value == null) return null;
  if (/^\d+$/.test(String(value).trim())) return Number(value) * 1000;
  const date = Date.parse(value), base = Date.parse(responseTime);
  return Number.isFinite(date) && Number.isFinite(base) && date >= base ? date - base : NaN;
}
export function analyze(har) {
  const entries = har?.log?.entries;
  if (!Array.isArray(entries)) throw new Error('input is not a HAR with log.entries');
  const ordered = entries.map((entry, index) => ({ entry, index, time: Date.parse(entry.startedDateTime) })).sort((a, b) => a.time - b.time || a.index - b.index), findings = [];
  let limitedResponseCount = 0;
  for (let i = 0; i < ordered.length; i++) {
    const { entry, time } = ordered[i], status = entry.response?.status;
    if (status !== 429 && status !== 503) continue;
    limitedResponseCount++;
    const responseTime = time + (Number(entry.time) || 0), key = `${entry.request?.method || 'GET'} ${endpoint(entry.request?.url)}`, raw = header(entry.response?.headers, 'retry-after'), waitMs = parseRetryAfter(raw, new Date(responseTime).toISOString());
    if (raw == null) { findings.push({ type: 'missing-retry-after', endpoint: key, status }); continue; }
    if (!Number.isFinite(waitMs)) { findings.push({ type: 'invalid-retry-after', endpoint: key, status }); continue; }
    const next = ordered.slice(i + 1).find(x => `${x.entry.request?.method || 'GET'} ${endpoint(x.entry.request?.url)}` === key);
    if (next) {
      const observedDelayMs = next.time - responseTime;
      if (observedDelayMs < waitMs) findings.push({ type: 'retried-too-early', endpoint: key, status, requiredDelayMs: waitMs, observedDelayMs });
    }
  }
  const counts = Object.fromEntries([...new Set(findings.map(x => x.type))].sort().map(type => [type, findings.filter(x => x.type === type).length]));
  return { entryCount: entries.length, limitedResponseCount, findingCount: findings.length, counts, findings };
}
