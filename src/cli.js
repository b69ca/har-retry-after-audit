#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { analyze } from './index.js';
const args = process.argv.slice(2), file = args.find(x => !x.startsWith('--'));
if (args.includes('--help')) { console.log('Usage: har-retry-after-audit FILE.har [--json] [--fail]'); process.exit(0); }
try {
  if (!file) throw new Error('a HAR file is required');
  const report = analyze(JSON.parse(await readFile(file, 'utf8')));
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else { console.log(`${report.entryCount} entries, ${report.limitedResponseCount} rate/service responses, ${report.findingCount} findings`); for (const f of report.findings) console.log(`${f.type}\t${f.status}\t${f.endpoint}${f.requiredDelayMs == null ? '' : `\trequired:${f.requiredDelayMs}ms observed:${f.observedDelayMs}ms`}`); }
  if (args.includes('--fail') && report.findingCount) process.exitCode = 1;
} catch (error) { console.error(`har-retry-after-audit: ${error.message}`); process.exitCode = 2; }
