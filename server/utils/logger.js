function safeMeta(meta = {}) {
  const blocked = ['password', 'token', 'apiKey', 'authorization', 'secret', 'content', 'userMessage', 'text', 'prompt'];
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (blocked.includes(k.toLowerCase()) || blocked.includes(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function logEvent(event, meta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...safeMeta(meta)
  };
  console.log(JSON.stringify(payload));
}

export function logError(event, err, meta = {}) {
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    event,
    error: err?.message || String(err),
    ...safeMeta(meta)
  }));
}
