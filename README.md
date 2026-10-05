# har-retry-after-audit

Audit `429 Too Many Requests` and `503 Service Unavailable` responses in a HAR capture.

The utility finds missing or invalid `Retry-After` headers and detects when the same method and endpoint was retried before the requested delay elapsed. Query strings and header values are not included in reports.

## Run

```bash
npx --yes github:b69ca/har-retry-after-audit capture.har
npx --yes github:b69ca/har-retry-after-audit capture.har --json --fail
```

`Retry-After` delta-seconds and HTTP-date forms are supported.

## Options

```text
--json  emit machine-readable JSON
--fail  exit 1 when findings exist
```

The HAR is read locally and no requests are replayed. Be aware that HAR files themselves can contain credentials and response bodies; this tool deliberately excludes those values from its output.

Node.js 20 or newer. No runtime dependencies.

## License

MIT
