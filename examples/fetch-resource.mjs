import { createHash } from 'node:crypto';
import { resolveResource } from 'emoji-kit';

// Opt in deliberately: emoji-kit performs no network requests itself.
const record = resolveResource({ sourceId: 'wechat-community-png', format: 'png' });
if (!record) {
  throw new Error('No matching WeChat resource was found');
}

const response = await fetch(record.url);
if (!response.ok) {
  throw new Error(`HTTP ${response.status} while fetching ${record.url}`);
}

const bytes = Buffer.from(await response.arrayBuffer());
const sha256 = createHash('sha256').update(bytes).digest('hex');
if (sha256 !== record.sha256) {
  throw new Error(`SHA-256 mismatch for ${record.id}`);
}

console.log(JSON.stringify({
  id: record.id,
  path: record.path,
  license: record.license,
  ref: record.ref,
  bytes: bytes.length,
  sha256,
}, null, 2));
