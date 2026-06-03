import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Neon Auth support
//
// Neon Auth (powered by Stack Auth) issues RS256 JWTs signed with a rotating
// key pair. We validate them by fetching the public JWKS once and caching it.
//
// HOW IT WORKS:
//   1. Your frontend uses the Neon Auth / Stack Auth client SDK to sign in.
//   2. The SDK gives the browser a JWT access token.
//   3. The browser sends: Authorization: Bearer <neon-jwt>
//   4. This middleware verifies the RS256 signature against the JWKS endpoint.
//   5. req.user is populated from the token claims.
//
// If you are NOT using Neon Auth and prefer your own HS256 tokens (the
// /auth/register + /auth/login routes), set USE_NEON_AUTH=false in .env.
// ---------------------------------------------------------------------------

const USE_NEON_AUTH = process.env.USE_NEON_AUTH === 'true';

// Simple in-memory JWKS cache — refreshed every 6 hours
let jwksCache = null;
let jwksCachedAt = 0;
const JWKS_TTL_MS = 6 * 60 * 60 * 1000;

async function getJwks() {
  if (jwksCache && Date.now() - jwksCachedAt < JWKS_TTL_MS) return jwksCache;

  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) throw new Error('NEON_AUTH_JWKS_URL is not set in environment');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);

  jwksCache = await res.json();
  jwksCachedAt = Date.now();
  return jwksCache;
}

// Convert a JWK RSA public key to PEM format for jsonwebtoken
function jwkToPem(jwk) {
  // jsonwebtoken accepts the raw JWK object directly in recent versions
  return { key: jwk, format: 'jwk' };
}

async function verifyNeonToken(token) {
  const jwks = await getJwks();

  // Decode header to find which key was used (kid)
  const header = JSON.parse(
    Buffer.from(token.split('.')[0], 'base64url').toString('utf8')
  );

  const jwk = jwks.keys?.find(k => k.kid === header.kid);
  if (!jwk) throw new Error('No matching JWK found for kid: ' + header.kid);

  return new Promise((resolve, reject) => {
    jwt.verify(token, jwkToPem(jwk), { algorithms: ['RS256'] }, (err, payload) => {
      if (err) return reject(err);
      resolve(payload);
    });
  });
}

// ---------------------------------------------------------------------------
// requireAuth middleware — works for BOTH Neon Auth and local JWT modes
// ---------------------------------------------------------------------------
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);

  try {
    let payload;

    if (USE_NEON_AUTH) {
      payload = await verifyNeonToken(token);
      // Neon Auth JWT claims: sub = user id, email, name, etc.
      req.user = {
        id: payload.sub,
        username: payload.email ?? payload.name ?? payload.sub,
        email: payload.email,
      };
    } else {
      payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub, username: payload.username };
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

// ---------------------------------------------------------------------------
// signToken — only used in local auth mode (not Neon Auth)
// ---------------------------------------------------------------------------
export function signToken(user) {
  if (USE_NEON_AUTH) {
    throw new Error('signToken called in Neon Auth mode — tokens are issued by Neon Auth');
  }
  return jwt.sign(
    { sub: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
  );
}
