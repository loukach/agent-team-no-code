import crypto from 'crypto';

export function generateFingerprint(req) {
  const components = [
    req.ip || req.connection.remoteAddress,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
  ];

  const fingerprintString = components.join('|');
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

export function getFingerprintFromRequest(req) {
  // Try to get from body first (client-side generated)
  if (req.body && req.body.fingerprint) {
    return req.body.fingerprint;
  }

  // Fallback to server-side generation
  return generateFingerprint(req);
}
