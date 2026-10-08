import app, { ensureDbConnected } from '../server.js';

export default async function handler(req, res) {
  await ensureDbConnected();
  return app(req, res);
}
