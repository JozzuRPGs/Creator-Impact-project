// Ably serverless token endpoint (Vercel). Uses promises API.
const Ably = require('ably/promises');

module.exports = async function handler(req, res) {
  try {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Missing ABLY_API_KEY' }));
    }

    const rest = new Ably.Rest({ key: apiKey });
    const clientId = `cc-${Math.random().toString(36).slice(2, 10)}`;
    // Capability can be object or JSON string.
    const capability = { '*': ['publish', 'subscribe', 'presence'] };

    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      capability,
      ttl: 60 * 60 * 1000 // 1 hour
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(tokenRequest));
  } catch (err) {
    console.error('Ably token error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Token error', details: String(err?.message || err) }));
  }
};
