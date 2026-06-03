import crypto from 'crypto';

const KEY_ENV = process.env.MESSAGE_ENCRYPTION_KEY;
let ENABLED = false;
let KEY_BUF = null;

if (KEY_ENV) {
  try {
    // support base64 or hex encoded keys
    if (/^[0-9a-fA-F]+$/.test(KEY_ENV) && (KEY_ENV.length === 64)) {
      KEY_BUF = Buffer.from(KEY_ENV, 'hex');
    } else {
      KEY_BUF = Buffer.from(KEY_ENV, 'base64');
    }
    if (KEY_BUF.length !== 32) {
      console.warn('[encryption] MESSAGE_ENCRYPTION_KEY must be 32 bytes (base64 or hex) — disabling encryption');
      KEY_BUF = null;
    } else {
      ENABLED = true;
    }
  } catch (err) {
    console.warn('[encryption] Failed to parse MESSAGE_ENCRYPTION_KEY — disabling encryption');
    KEY_BUF = null;
  }
} else {
  console.warn('[encryption] MESSAGE_ENCRYPTION_KEY not set — message encryption disabled');
}

export function isEnabled() {
  return ENABLED;
}

export function encrypt(plaintext) {
  if (!ENABLED) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUF, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decrypt(payload) {
  if (!ENABLED) return payload;
  if (!payload) return payload;
  try {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.slice(0, 12);
    const tag = buf.slice(12, 28);
    const ct = buf.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUF, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
    return plain.toString('utf8');
  } catch (err) {
    console.error('[encryption] decrypt failed:', err.message);
    return payload; // return original so callers don't break
  }
}
